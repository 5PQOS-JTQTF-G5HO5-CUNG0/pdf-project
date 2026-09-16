import sys
from pathlib import Path
import pytest
import fitz
import docx

backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.ocr.engine import run_ocr_on_image
from app.ocr.searchable_pdf import create_searchable_pdf
from app.ocr.ocr_to_doc import ocr_to_docx, ocr_extract_text

@pytest.fixture(scope="session")
def setup_samples():
    from tests.generate_samples import (
        SAMPLES_DIR,
        generate_sample_images,
        generate_pdf_samples
    )
    if not (SAMPLES_DIR / "image.jpg").exists():
        generate_sample_images()
    if not (SAMPLES_DIR / "scan.pdf").exists():
        generate_pdf_samples()
    return SAMPLES_DIR

def test_ocr_extract_text_image(setup_samples):
    samples = setup_samples
    img_path = samples / "image.jpg"
    text = ocr_extract_text(img_path)
    assert isinstance(text, str)

def test_create_searchable_pdf(setup_samples, tmp_path):
    samples = setup_samples
    scan_pdf = samples / "scan.pdf"
    out_pdf = tmp_path / "searchable_output.pdf"

    res = create_searchable_pdf(scan_pdf, out_pdf, dpi=150)
    assert res.exists()
    assert res.stat().st_size > 0

    # 验证生成的 PDF 可打开且含有页面
    with fitz.open(str(res)) as doc:
        assert len(doc) > 0

def test_ocr_to_docx(setup_samples, tmp_path):
    samples = setup_samples
    scan_pdf = samples / "scan.pdf"
    out_docx = tmp_path / "ocr_extracted.docx"

    res = ocr_to_docx(scan_pdf, out_docx)
    assert res.exists()
    assert res.stat().st_size > 0

    doc = docx.Document(str(res))
    assert len(doc.paragraphs) > 0
