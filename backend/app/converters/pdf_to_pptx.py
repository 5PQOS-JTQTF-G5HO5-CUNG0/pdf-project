import io
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
import fitz # PyMuPDF
from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.dml.color import RGBColor
from app.converters.base import BaseConverter

logger = logging.getLogger("converter.pdf_to_pptx")

class PdfToPptxConverter(BaseConverter):
    """
    基于 PyMuPDF 与 python-pptx 实现 PDF 转 PowerPoint (PPTX)
    提供两种重建模式：
    - 'editable'：对象级可编辑重建（提取文本块与内嵌图像到原生 PPT 形状）
    - 'presentation'：高保真投影模式（页面高清光栅化嵌入）
    """

    @property
    def source_formats(self) -> List[str]:
        return [".pdf"]

    @property
    def target_format(self) -> str:
        return "pptx"

    def convert(self, input_path: Path, output_path: Path, options: Optional[Dict[str, Any]] = None) -> Path:
        if not input_path.exists():
            raise FileNotFoundError(f"输入文件不存在: {input_path}")

        options = options or {}
        mode = options.get("mode", "editable").lower()

        prs = Presentation()
        # 清除默认母版中的第一张空白幻灯片
        blank_slide_layout = prs.slide_layouts[6] # 纯空白版式

        with fitz.open(str(input_path)) as doc:
            if len(doc) == 0:
                raise ValueError("PDF 文档无有效页面。")

            # 读取第一页设置 PPT 幻灯片尺寸（将 72 DPI PDF 点数转为 Inches）
            first_page = doc[0]
            prs.slide_width = Inches(first_page.rect.width / 72.0)
            prs.slide_height = Inches(first_page.rect.height / 72.0)

            for page_idx, page in enumerate(doc):
                slide = prs.slides.add_slide(blank_slide_layout)
                page_rect = page.rect
                page_w_pt = page_rect.width
                page_h_pt = page_rect.height

                if mode == "presentation":
                    # 高保真模式：渲染 300 DPI 页面作为整页底图
                    pix = page.get_pixmap(dpi=200)
                    img_stream = io.BytesIO(pix.tobytes("png"))
                    slide.shapes.add_picture(
                        img_stream,
                        left=0,
                        top=0,
                        width=prs.slide_width,
                        height=prs.slide_height
                    )
                else:
                    # 可编辑对象级重建模式
                    # 1. 提取文本块
                    blocks = page.get_text("blocks")
                    for b in blocks:
                        # b: (x0, y0, x1, y1, text, block_no, block_type)
                        # block_type == 0 为文本
                        if b[6] == 0:
                            x0, y0, x1, y1, text = b[0], b[1], b[2], b[3], b[4]
                            text = text.strip()
                            if not text:
                                continue

                            left = Inches(x0 / 72.0)
                            top = Inches(y0 / 72.0)
                            width = Inches(max(0.5, (x1 - x0) / 72.0))
                            height = Inches(max(0.3, (y1 - y0) / 72.0))

                            tx_box = slide.shapes.add_textbox(left, top, width, height)
                            tf = tx_box.text_frame
                            tf.word_wrap = True
                            tf.margin_left = 0
                            tf.margin_right = 0
                            tf.margin_top = 0
                            tf.margin_bottom = 0

                            # 估算字号
                            box_h_pt = y1 - y0
                            lines = text.split("\n")
                            line_count = max(1, len(lines))
                            approx_font_size = min(28, max(9, int((box_h_pt / line_count) * 0.75)))

                            p = tf.paragraphs[0]
                            p.text = text
                            p.font.name = "Microsoft YaHei"
                            p.font.size = Pt(approx_font_size)
                            p.font.color.rgb = RGBColor(30, 41, 59)

                    # 2. 提取内嵌图像并放入幻灯片
                    image_list = page.get_images(full=True)
                    for img_info in image_list:
                        xref = img_info[0]
                        try:
                            base_img = doc.extract_image(xref)
                            img_bytes = base_img["image"]
                            img_stream = io.BytesIO(img_bytes)
                            # 如果可以获取图像在页面上的矩形位置
                            rects = page.get_image_rects(xref)
                            for r in rects:
                                slide.shapes.add_picture(
                                    img_stream,
                                    left=Inches(r.x0 / 72.0),
                                    top=Inches(r.y0 / 72.0),
                                    width=Inches((r.x1 - r.x0) / 72.0),
                                    height=Inches((r.y1 - r.y0) / 72.0)
                                )
                        except Exception:
                            pass

        output_path.parent.mkdir(parents=True, exist_ok=True)
        prs.save(str(output_path))
        logger.info(f"成功将 PDF 转换为 PPTX [{mode} 模式]: {output_path}")
        return output_path
