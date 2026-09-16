import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
from PIL import Image
from app.converters.base import BaseConverter

logger = logging.getLogger("converter.image_to_pdf")

class ImageToPdfConverter(BaseConverter):
    """基于 Pillow 将单张或序列图片转换为标准 PDF 文档"""

    @property
    def source_formats(self) -> List[str]:
        return [".jpg", ".jpeg", ".png", ".webp"]

    @property
    def target_format(self) -> str:
        return "pdf"

    def convert(self, input_path: Path, output_path: Path, options: Optional[Dict[str, Any]] = None) -> Path:
        if not input_path.exists():
            raise FileNotFoundError(f"输入图片不存在: {input_path}")

        try:
            with Image.open(input_path) as img:
                # PDF 转换要求 RGB 模式（RGBA/P 模式转为带白底的 RGB）
                if img.mode in ("RGBA", "LA", "P"):
                    rgb_img = Image.new("RGB", img.size, (255, 255, 255))
                    if img.mode == "P":
                        img = img.convert("RGBA")
                    rgb_img.paste(img, mask=img.split()[-1] if "A" in img.mode else None)
                else:
                    rgb_img = img.convert("RGB")

                output_path.parent.mkdir(parents=True, exist_ok=True)
                rgb_img.save(output_path, "PDF", resolution=100.0)

            logger.info(f"成功将图片转换为 PDF: {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"图片转 PDF 失败: {str(e)}")
            raise RuntimeError(f"图片转 PDF 失败: {str(e)}")
