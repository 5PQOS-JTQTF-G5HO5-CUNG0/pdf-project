import re
import logging
from pathlib import Path
from typing import List, Optional, Union
import fitz

logger = logging.getLogger("pdf_tools.remove_watermark")

def remove_watermark(
    input_path: Path,
    output_path: Path,
    mode: str = "text",
    keywords: Optional[Union[str, List[str]]] = None,
    case_sensitive: bool = False,
    fill_mode: str = "none",
    clean_artifacts: bool = True,
    clean_image_watermark: bool = False,
    area_type: Optional[str] = None,
    area_ratio: float = 0.08
) -> Path:
    """
    去除 PDF 水印功能
    :param input_path: 输入 PDF 路径
    :param output_path: 输出 PDF 路径
    :param mode: 模式 ("text", "layer", "area", "all")
    :param keywords: 待清除的文本水印关键字（支持单个字符串、逗号/换行分隔的多个词或列表）
    :param case_sensitive: 文本匹配是否区分大小写
    :param fill_mode: 擦除填充方式 ("none": 透明无痕擦除矢量指令; "white": 纯白背景块遮盖)
    :param clean_artifacts: 是否智能清除 Form XObject 及 /Artifact 水印标记
    :param clean_image_watermark: 是否清除全页半透明/覆盖型图片水印
    :param area_type: 区域擦除类型 ("header": 页眉, "footer": 页脚, "both": 页眉与页脚)
    :param area_ratio: 区域擦除占页面高度比例（默认 0.08，即 8%）
    :return: 输出 PDF 路径
    """
    if not input_path.exists():
        raise FileNotFoundError(f"PDF 文件未找到: {input_path}")

    # 标准化关键词列表
    kw_list: List[str] = []
    if keywords:
        if isinstance(keywords, str):
            # 支持逗号、分号、换行符分隔
            parts = re.split(r"[,;\n\r]+", keywords)
            kw_list = [p.strip() for p in parts if p.strip()]
        elif isinstance(keywords, list):
            kw_list = [str(k).strip() for k in keywords if str(k).strip()]

    # 校验模式参数
    if mode in ("text", "all") and not kw_list and not clean_artifacts and not area_type:
        raise ValueError("请提供至少一个水印关键字、或选择图层清理/区域擦除。")

    fill_color = (1, 1, 1) if fill_mode.lower() == "white" else None

    doc = fitz.open(str(input_path))
    try:
        total_redactions = 0
        total_layers_cleaned = 0

        for page_idx, page in enumerate(doc):
            rect = page.rect
            page_w = rect.width
            page_h = rect.height

            # 1. 文本水印匹配与擦除 (mode: "text" 或 "all")
            if mode in ("text", "all") and kw_list:
                page_redact_rects = []
                for kw in kw_list:
                    # 准备搜索变体（区分/不区分大小写）
                    search_terms = [kw]
                    if not case_sensitive:
                        variants = {kw.lower(), kw.upper(), kw.title()}
                        search_terms = list(variants)

                    for term in search_terms:
                        matches = page.search_for(term, quads=False)
                        for r in matches:
                            page_redact_rects.append(r)

                    # 针对拆分成单个词或跨 span 的情况，进一步使用 words 辅助扫描
                    if not case_sensitive:
                        words = page.get_text("words")  # (x0, y0, x1, y1, "word", ...)
                        kw_lower = kw.lower()
                        for w in words:
                            if kw_lower in w[4].lower():
                                page_redact_rects.append(fitz.Rect(w[0], w[1], w[2], w[3]))

                # 排除完全重叠的矩形，添加 Redaction 标注
                unique_rects = []
                for r in page_redact_rects:
                    # 扩大 1px 消除边缘毛刺
                    expanded_r = fitz.Rect(r.x0 - 1, r.y0 - 1, r.x1 + 1, r.y1 + 1)
                    if not any(expanded_r.intersects(existing) and abs(expanded_r.get_area() - existing.get_area()) < 5 for existing in unique_rects):
                        unique_rects.append(expanded_r)

                for r in unique_rects:
                    page.add_redact_annot(r, fill=fill_color)
                    total_redactions += 1

            # 2. 区域水印抹除 (mode: "area" 或指定了 area_type)
            if mode in ("area", "all") or area_type:
                target_areas = []
                if area_type in ("header", "both"):
                    header_h = page_h * area_ratio
                    target_areas.append(fitz.Rect(0, 0, page_w, header_h))
                if area_type in ("footer", "both"):
                    footer_h = page_h * area_ratio
                    target_areas.append(fitz.Rect(0, page_h - footer_h, page_w, page_h))

                for area_rect in target_areas:
                    page.add_redact_annot(area_rect, fill=fill_color)
                    total_redactions += 1

            # 执行文字与区域抹除
            page.apply_redactions(images=fitz.PDF_REDACT_IMAGE_NONE)

            # 3. 智能清除 /Artifact 水印标记和 Form XObject (mode: "layer" 或 clean_artifacts)
            if mode in ("layer", "all") or clean_artifacts:
                try:
                    # 获取该页的内容流并过滤包含 Watermark 标记的 Artifact
                    contents = page.read_contents()
                    if contents and (b"/Watermark" in contents or b"/Artifact" in contents):
                        # 正则移除常见的 /Artifact <</Subtype /Watermark ...>> BDC ... EMC 块
                        # 兼容单行与跨行
                        cleaned_contents = re.sub(
                            rb"/Artifact\s*<<[^>]*?/Watermark[^>]*?>>\s*BDC.*?EMC\s*",
                            b"",
                            contents,
                            flags=re.DOTALL
                        )
                        if cleaned_contents != contents:
                            # 替换当前页面内容流
                            xref_list = page.get_contents()
                            if xref_list:
                                doc.update_stream(xref_list[0], cleaned_contents)
                                for extra_xref in xref_list[1:]:
                                    doc.update_stream(extra_xref, b"")
                                total_layers_cleaned += 1
                except Exception as e:
                    logger.debug(f"清理页面 {page_idx} Artifact 异常: {e}")

            # 4. 全页半透明/覆盖型图片水印检测与清理
            if clean_image_watermark:
                try:
                    images = page.get_images(full=True)
                    for img_info in images:
                        xref = img_info[0]
                        # 检查图片在页面中的放置位置
                        rects = page.get_image_rects(xref)
                        for r in rects:
                            # 如果图片覆盖了页面 75% 以上面积，判定为整页背景/水印浮层
                            area_ratio_covered = r.get_area() / (page_w * page_h)
                            if area_ratio_covered >= 0.75:
                                doc.update_stream(xref, b"")
                                total_layers_cleaned += 1
                                break
                except Exception as e:
                    logger.debug(f"清理页面 {page_idx} 图片水印异常: {e}")

            # 整理当前页面内容流
            try:
                page.clean_contents()
            except Exception:
                pass

        output_path.parent.mkdir(parents=True, exist_ok=True)
        # 清除无用引用，深度垃圾回收和流压缩
        doc.save(str(output_path), garbage=4, deflate=True, clean=True)
        logger.info(
            f"PDF 去水印完成: {output_path.name}, 抹除区域数: {total_redactions}, "
            f"清理浮层数: {total_layers_cleaned}"
        )
        return output_path
    finally:
        doc.close()
