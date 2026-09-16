import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
import pdfplumber
import openpyxl
from openpyxl.styles import Font, PatternFill, Alignment, Border, Side
from openpyxl.utils import get_column_letter
from app.converters.base import BaseConverter

logger = logging.getLogger("converter.pdf_to_xlsx")

class PdfToXlsxConverter(BaseConverter):
    """基于 pdfplumber 与 openpyxl 实现高质量表格提取与 Excel (.xlsx) 重建"""

    @property
    def source_formats(self) -> List[str]:
        return [".pdf"]

    @property
    def target_format(self) -> str:
        return "xlsx"

    def convert(self, input_path: Path, output_path: Path, options: Optional[Dict[str, Any]] = None) -> Path:
        if not input_path.exists():
            raise FileNotFoundError(f"输入文件不存在: {input_path}")

        wb = openpyxl.Workbook()
        # 移除默认的空白 Sheet
        default_sheet = wb.active

        thin_border = Border(
            left=Side(style='thin', color='D3D3D3'),
            right=Side(style='thin', color='D3D3D3'),
            top=Side(style='thin', color='D3D3D3'),
            bottom=Side(style='thin', color='D3D3D3')
        )
        header_fill = PatternFill(start_color="F1F5F9", end_color="F1F5F9", fill_type="solid")
        header_font = Font(name="Microsoft YaHei", size=11, bold=True, color="1E293B")
        cell_font = Font(name="Microsoft YaHei", size=10, color="334155")

        tables_found_total = 0

        with pdfplumber.open(str(input_path)) as pdf:
            for page_idx, page in enumerate(pdf.pages):
                sheet_title = f"Page_{page_idx + 1}"
                ws = wb.create_sheet(title=sheet_title)

                # 优先采用表格检测算法
                tables = page.extract_tables({
                    "vertical_strategy": "lines",
                    "horizontal_strategy": "lines",
                    "snap_tolerance": 3,
                    "join_tolerance": 3,
                })

                # 若默认线段策略未识别出表格，尝试文本坐标策略 (text strategy)
                if not tables:
                    tables = page.extract_tables({
                        "vertical_strategy": "text",
                        "horizontal_strategy": "text"
                    })

                current_row = 1

                if tables:
                    for t_idx, tbl in enumerate(tables):
                        tables_found_total += 1
                        if t_idx > 0:
                            current_row += 2 # 表格之间留空行

                        for r_idx, row in enumerate(tbl):
                            for c_idx, val in enumerate(row):
                                cell_val = (val or "").strip()
                                cell = ws.cell(row=current_row, column=c_idx + 1, value=cell_val)
                                cell.border = thin_border
                                cell.alignment = Alignment(vertical="center", wrap_text=True)

                                if r_idx == 0:
                                    cell.fill = header_fill
                                    cell.font = header_font
                                else:
                                    cell.font = cell_font
                            current_row += 1
                else:
                    # 页面中没有检测到标准表格：提取结构化文本行与列填入 Excel
                    text = page.extract_text()
                    if text:
                        for line in text.split("\n"):
                            line_str = line.strip()
                            if not line_str:
                                continue
                            # 按照多个空格或制表符切分单元格
                            parts = [p.strip() for p in line_str.split("  ") if p.strip()]
                            if not parts:
                                parts = [line_str]
                            for c_idx, p_text in enumerate(parts):
                                cell = ws.cell(row=current_row, column=c_idx + 1, value=p_text)
                                cell.font = cell_font
                            current_row += 1

                # 自适应调整列宽
                for col in ws.columns:
                    max_len = 0
                    col_letter = get_column_letter(col[0].column)
                    for cell in col:
                        if cell.value:
                            val_s = str(cell.value)
                            # 中文字符按双倍长度计算
                            length = sum(2 if ord(c) > 127 else 1 for c in val_s)
                            if length > max_len:
                                max_len = length
                    ws.column_dimensions[col_letter].width = min(max(max_len + 3, 10), 60)

        # 清除最初未使用的 default sheet
        if default_sheet in wb.worksheets and len(wb.worksheets) > 1:
            wb.remove(default_sheet)

        output_path.parent.mkdir(parents=True, exist_ok=True)
        wb.save(str(output_path))
        logger.info(f"成功将 PDF 表格转换为 Excel: {output_path} (共提取 {tables_found_total} 个表格)")
        return output_path
