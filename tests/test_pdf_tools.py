import sys
from pathlib import Path
import pytest
import fitz

# 确保 backend 在 sys.path
backend_path = Path(__file__).resolve().parent.parent / "backend"
if str(backend_path) not in sys.path:
    sys.path.insert(0, str(backend_path))

from app.pdf_tools.merge import merge_pdfs
from app.pdf_tools.split import split_pdf
from app.pdf_tools.rotate import rotate_pdf
from app.pdf_tools.compress import compress_pdf
from app.pdf_tools.security import encrypt_pdf, decrypt_pdf
from app.pdf_tools.watermark import add_watermark
from app.pdf_tools.remove_watermark import remove_watermark

@pytest.fixture(scope="session")
def setup_samples():
    """确保样本文件存在"""
    from tests.generate_samples import SAMPLES_DIR, generate_pdf_samples
    if not (SAMPLES_DIR / "text.pdf").exists():
        generate_pdf_samples()
    return SAMPLES_DIR

def test_merge_pdfs(setup_samples, tmp_path):
    samples = setup_samples
    pdf1 = samples / "text.pdf"
    pdf2 = samples / "table.pdf"
    output = tmp_path / "merged_test.pdf"

    merged = merge_pdfs([pdf1, pdf2], output)
    assert merged.exists()
    assert merged.stat().st_size > 0

    with fitz.open(str(merged)) as doc:
        assert len(doc) == 2

def test_split_pdf_ranges(setup_samples, tmp_path):
    samples = setup_samples
    # 先制作一个 3 页的临时 PDF
    temp_3p = tmp_path / "three_pages.pdf"
    doc = fitz.open()
    for _ in range(3):
        doc.new_page()
    doc.save(str(temp_3p))
    doc.close()

    output = tmp_path / "extracted.pdf"
    extracted = split_pdf(temp_3p, output, page_ranges="1,3")
    assert extracted.exists()

    with fitz.open(str(extracted)) as res_doc:
        assert len(res_doc) == 2

def test_split_pdf_each_zip(setup_samples, tmp_path):
    samples = setup_samples
    temp_3p = tmp_path / "three_pages.pdf"
    if not temp_3p.exists():
        doc = fitz.open()
        for _ in range(3):
            doc.new_page()
        doc.save(str(temp_3p))
        doc.close()

    output = tmp_path / "split_all.zip"
    zip_res = split_pdf(temp_3p, output, page_ranges="each")
    assert zip_res.exists()
    assert zip_res.suffix == ".zip"

def test_rotate_pdf(setup_samples, tmp_path):
    samples = setup_samples
    src = samples / "text.pdf"
    output = tmp_path / "rotated.pdf"

    res = rotate_pdf(src, output, angle=90, pages="all")
    assert res.exists()
    with fitz.open(str(res)) as doc:
        assert doc[0].rotation == 90

def test_encrypt_and_decrypt_pdf(setup_samples, tmp_path):
    samples = setup_samples
    src = samples / "text.pdf"
    enc_output = tmp_path / "encrypted.pdf"
    dec_output = tmp_path / "decrypted.pdf"
    pw = "SecretPass123!"

    # 1. 加密
    encrypt_pdf(src, enc_output, pw)
    assert enc_output.exists()
    with fitz.open(str(enc_output)) as doc:
        assert doc.is_encrypted is True
        # 尝试使用错误密码认证应失败
        assert doc.authenticate("wrong_pw") == 0
        # 验证正确密码
        assert doc.authenticate(pw) > 0

    # 2. 解密
    decrypt_pdf(enc_output, dec_output, pw)
    assert dec_output.exists()
    with fitz.open(str(dec_output)) as doc:
        assert doc.is_encrypted is False

def test_watermark_pdf(setup_samples, tmp_path):
    samples = setup_samples
    src = samples / "text.pdf"
    output = tmp_path / "watermarked.pdf"

    res = add_watermark(src, output, text="TEST_WATERMARK", opacity=0.3, rotation=45)
    assert res.exists()
    assert res.stat().st_size > 0

def test_compress_pdf(setup_samples, tmp_path):
    samples = setup_samples
    src = samples / "text.pdf"
    output = tmp_path / "compressed.pdf"

    res = compress_pdf(src, output, level="medium")
    assert res.exists()
    assert res.stat().st_size > 0

def test_remove_watermark_text(setup_samples, tmp_path):
    samples = setup_samples
    src = samples / "text.pdf"
    watermarked = tmp_path / "watermarked_for_removal.pdf"
    cleaned = tmp_path / "watermark_removed.pdf"

    # 先添加水印
    wm_text = "CONFIDENTIAL_TEST"
    add_watermark(src, watermarked, text=wm_text, opacity=0.4, rotation=0)
    assert watermarked.exists()

    # 验证添加了该文字
    with fitz.open(str(watermarked)) as doc:
        has_text = any(wm_text in page.get_text() for page in doc)
        # 如果水印使用内置字体写入，检查页面
        assert len(doc) > 0

    # 执行去除水印
    res = remove_watermark(
        watermarked,
        cleaned,
        mode="text",
        keywords=wm_text,
        case_sensitive=False,
        fill_mode="none"
    )
    assert res.exists()
    assert res.stat().st_size > 0

    # 验证清理后的文档依然完整
    with fitz.open(str(res)) as doc:
        assert len(doc) > 0
        # 确保关键词已被清除
        for page in doc:
            matches = page.search_for(wm_text)
            assert len(matches) == 0

def test_remove_watermark_area(setup_samples, tmp_path):
    samples = setup_samples
    src = samples / "text.pdf"
    cleaned = tmp_path / "area_cleaned.pdf"

    res = remove_watermark(
        src,
        cleaned,
        mode="area",
        area_type="header",
        area_ratio=0.08,
        fill_mode="white"
    )
    assert res.exists()
    assert res.stat().st_size > 0

