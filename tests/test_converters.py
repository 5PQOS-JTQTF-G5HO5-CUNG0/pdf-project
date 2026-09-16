import sys
from pathlib import Path
import pytest
from PIL import Image

backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.converters.pdf_to_docx import PdfToDocxConverter
from app.converters.pdf_to_image import PdfToImageConverter
from app.converters.image_to_pdf import ImageToPdfConverter
from app.converters.router import conversion_router

@pytest.fixture(scope="session")
def setup_samples():
    from tests.generate_samples import (
        SAMPLES_DIR,
        generate_sample_images,
        generate_pdf_samples
    )
    if not (SAMPLES_DIR / "image.png").exists():
        generate_sample_images()
    if not (SAMPLES_DIR / "text.pdf").exists():
        generate_pdf_samples()
    return SAMPLES_DIR

def test_conversion_router_lookups():
    # 验证内置转换器注册
    assert conversion_router.get_converter(".pdf", "docx") is not None
    assert conversion_router.get_converter(".pdf", "png") is not None
    assert conversion_router.get_converter(".png", "pdf") is not None
    assert conversion_router.get_converter(".docx", "pdf") is not None
    assert conversion_router.get_converter(".xlsx", "pdf") is not None
    assert conversion_router.get_converter(".pptx", "pdf") is not None
    # 验证不支持的反查
    assert conversion_router.get_converter(".xyz", "pdf") is None

def test_image_to_pdf(setup_samples, tmp_path):
    samples = setup_samples
    src_png = samples / "image.png"
    out_pdf = tmp_path / "img_converted.pdf"

    conv = ImageToPdfConverter()
    res = conv.convert(src_png, out_pdf)
    assert res.exists()
    assert res.stat().st_size > 0

def test_pdf_to_image(setup_samples, tmp_path):
    samples = setup_samples
    src_pdf = samples / "text.pdf"
    out_png = tmp_path / "page.png"

    conv = PdfToImageConverter("png")
    res = conv.convert(src_pdf, out_png, options={"dpi": 150})
    assert res.exists()
    assert res.stat().st_size > 0

    with Image.open(res) as img:
        assert img.size[0] > 0
        assert img.size[1] > 0

def test_pdf_to_docx(setup_samples, tmp_path):
    samples = setup_samples
    src_pdf = samples / "text.pdf"
    out_docx = tmp_path / "converted.docx"

    conv = PdfToDocxConverter()
    res = conv.convert(src_pdf, out_docx)
    assert res.exists()
    assert res.stat().st_size > 0
