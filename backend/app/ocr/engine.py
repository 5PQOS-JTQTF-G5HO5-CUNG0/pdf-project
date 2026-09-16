import logging
from typing import List, Dict, Any, Union
from pathlib import Path
import numpy as np
from PIL import Image
import io

logger = logging.getLogger("ocr.engine")

_engine_instance = None

def get_ocr_engine():
    """获取或延迟初始化 RapidOCR 引擎（基于 PaddleOCR ONNX 权重）"""
    global _engine_instance
    if _engine_instance is None:
        try:
            from rapidocr_onnxruntime import RapidOCR
            _engine_instance = RapidOCR()
            logger.info("RapidOCR 引擎初始化成功。")
        except Exception as e:
            logger.error(f"RapidOCR 初始化失败: {e}")
            raise RuntimeError(f"OCR 引擎加载失败: {e}")
    return _engine_instance

def run_ocr_on_image(image_input: Union[Path, bytes, Image.Image, np.ndarray]) -> List[Dict[str, Any]]:
    """
    执行单张图片的文本检测与识别
    :param image_input: 图片路径、二进制、PIL Image 或 numpy array
    :return: 包含坐标、文本内容与置信度的列表
    """
    engine = get_ocr_engine()

    # 处理输入为 numpy array
    if isinstance(image_input, (str, Path)):
        img = Image.open(str(image_input)).convert("RGB")
        img_np = np.array(img)
    elif isinstance(image_input, bytes):
        img = Image.open(io.BytesIO(image_input)).convert("RGB")
        img_np = np.array(img)
    elif isinstance(image_input, Image.Image):
        img_np = np.array(image_input.convert("RGB"))
    elif isinstance(image_input, np.ndarray):
        img_np = image_input
    else:
        raise ValueError("不支持的图片输入类型")

    result, elapse = engine(img_np)
    if not result:
        return []

    structured_results = []
    for item in result:
        # item: [box, text, score]
        box, text, score = item
        structured_results.append({
            "box": box, # 4个顶点的坐标 [[x1,y1],[x2,y2],[x3,y3],[x4,y4]]
            "text": text,
            "score": float(score)
        })

    return structured_results
