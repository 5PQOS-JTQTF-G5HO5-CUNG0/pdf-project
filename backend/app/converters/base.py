from abc import ABC, abstractmethod
from pathlib import Path
from typing import Optional, Dict, Any

class BaseConverter(ABC):
    """文件转换器基类接口规范"""

    @property
    @abstractmethod
    def source_formats(self) -> list[str]:
        """支持的源文件格式列表，如 ['.docx', '.doc']"""
        pass

    @property
    @abstractmethod
    def target_format(self) -> str:
        """转换目标格式，如 'pdf'"""
        pass

    @abstractmethod
    def convert(self, input_path: Path, output_path: Path, options: Optional[Dict[str, Any]] = None) -> Path:
        """
        执行具体文件转换
        :param input_path: 源文件路径
        :param output_path: 目标文件输出路径
        :param options: 可选参数字典（如 dpi, quality 等）
        :return: 最终生成的文件路径
        """
        pass
