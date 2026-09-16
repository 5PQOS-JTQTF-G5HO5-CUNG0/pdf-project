import logging
from typing import Dict, Tuple, Optional, List
from app.converters.base import BaseConverter
from app.converters.office_to_pdf import OfficeToPdfConverter
from app.converters.pdf_to_docx import PdfToDocxConverter
from app.converters.pdf_to_xlsx import PdfToXlsxConverter
from app.converters.pdf_to_pptx import PdfToPptxConverter
from app.converters.pdf_to_image import PdfToImageConverter
from app.converters.image_to_pdf import ImageToPdfConverter

logger = logging.getLogger("converter.router")

class ConversionRouter:
    """转换器路由注册中心，解耦 Controller 与各具体转换实现"""

    def __init__(self):
        self._registry: Dict[Tuple[str, str], BaseConverter] = {}
        self._register_default_converters()

    def register(self, converter: BaseConverter):
        target = converter.target_format.lower().lstrip(".")
        for src in converter.source_formats:
            src_norm = src.lower() if src.startswith(".") else f".{src.lower()}"
            self._registry[(src_norm, target)] = converter
            logger.debug(f"Registered converter: {src_norm} -> {target} => {converter.__class__.__name__}")

    def _register_default_converters(self):
        # 1. Office -> PDF (Gotenberg)
        self.register(OfficeToPdfConverter())

        # 2. PDF -> Word (pdf2docx)
        self.register(PdfToDocxConverter())

        # 3. PDF -> Excel (pdfplumber + openpyxl)
        self.register(PdfToXlsxConverter())

        # 4. PDF -> PowerPoint (python-pptx)
        self.register(PdfToPptxConverter())

        # 5. PDF -> Images (PyMuPDF)
        self.register(PdfToImageConverter("png"))
        self.register(PdfToImageConverter("jpg"))
        self.register(PdfToImageConverter("jpeg"))
        self.register(PdfToImageConverter("webp"))

        # 6. Images -> PDF (Pillow)
        self.register(ImageToPdfConverter())

    def get_converter(self, source_ext: str, target_format: str) -> Optional[BaseConverter]:
        src_norm = source_ext.lower() if source_ext.startswith(".") else f".{source_ext.lower()}"
        target_norm = target_format.lower().lstrip(".")
        return self._registry.get((src_norm, target_norm))

    def get_supported_targets(self, source_ext: str) -> List[str]:
        src_norm = source_ext.lower() if source_ext.startswith(".") else f".{source_ext.lower()}"
        targets = []
        for (s, t) in self._registry.keys():
            if s == src_norm:
                targets.append(t)
        return sorted(list(set(targets)))

    def get_all_supported_matrix(self) -> Dict[str, List[str]]:
        matrix: Dict[str, List[str]] = {}
        for (s, t) in self._registry.keys():
            matrix.setdefault(s, []).append(t)
        for s in matrix:
            matrix[s] = sorted(list(set(matrix[s])))
        return matrix

conversion_router = ConversionRouter()
