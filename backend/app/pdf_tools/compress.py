import logging
import io
from pathlib import Path
from PIL import Image
import fitz

logger = logging.getLogger("pdf_tools.compress")

def compress_pdf(input_path: Path, output_path: Path, level: str = "medium") -> Path:
    """对 PDF 文档进行多级压缩优化（清理冗余对象、压缩流及重新采样图像）"""
    if not input_path.exists():
        raise FileNotFoundError(f"PDF 文件未找到: {input_path}")

    # 压缩级别配置: (deflate, clean, quality)
    quality_map = {
        "low": 85,
        "medium": 70,
        "high": 50
    }
    img_quality = quality_map.get(level.lower(), 70)

    doc = fitz.open(str(input_path))
    try:
        # 遍历文档中的图片进行重新压缩
        if level in ("medium", "high"):
            for page in doc:
                image_list = page.get_images(full=True)
                for img_info in image_list:
                    xref = img_info[0]
                    base_image = doc.extract_image(xref)
                    image_bytes = base_image["image"]
                    ext = base_image["ext"]

                    try:
                        with Image.open(io.BytesIO(image_bytes)) as pil_img:
                            if pil_img.format in ("JPEG", "PNG"):
                                out_io = io.BytesIO()
                                pil_img.convert("RGB").save(out_io, format="JPEG", quality=img_quality, optimize=True)
                                doc.update_stream(xref, out_io.getvalue())
                    except Exception:
                        pass # 跳过不支持或特殊编码的内置流

        output_path.parent.mkdir(parents=True, exist_ok=True)
        # garbage=4 清除未引用的流并压缩重复流
        doc.save(str(output_path), garbage=4, deflate=True, clean=True)
        logger.info(f"成功压缩 PDF: {output_path}")
        return output_path
    finally:
        doc.close()
