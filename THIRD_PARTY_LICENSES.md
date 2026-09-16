# 第三方开源组件许可证清单 (Third-Party Licenses)

LocalPDF 项目基于一系列优秀的开源技术与组件构建。所有文件转换与处理逻辑完全在本机 Docker 隔离环境中运行，不向任何第三方云平台传输数据。

下表列出本项目依赖的核心第三方组件、版本规范、开源许可证及使用说明：

| 组件名称 | 类型 | 开源许可证 | 项目主页 / 源码仓库 | 在本项目中的作用与说明 |
| :--- | :--- | :--- | :--- | :--- |
| **Gotenberg** | 容器镜像 | MIT License | https://github.com/gotenberg/gotenberg | Docker 微服务，提供无头浏览器与 LibreOffice 文档转换 API |
| **LibreOffice** | 办公套件 | MPL-2.0 / LGPL-3.0 | https://www.libreoffice.org/ | Gotenberg 内部驱动，负责将 DOC/DOCX/XLS/XLSX/PPT/PPTX 转为标准 PDF |
| **FastAPI** | 后端框架 | MIT License | https://github.com/fastapi/fastapi | 高性能 Python 异步 Web 框架，提供 API 路由与任务调度 |
| **Uvicorn** | ASGI 服务器 | BSD 3-Clause | https://github.com/encode/uvicorn | 承载 FastAPI 应用的 ASGI 高性能服务器 |
| **Pydantic** | 数据校验 | MIT License | https://github.com/pydantic/pydantic | 请求与响应数据建模、参数强类型验证 |
| **pdf2docx** | Python 库 | GPL-3.0 | https://github.com/dothinking/pdf2docx | 解析 PDF 布局、文本块、表格与图像并重建为 DOCX 文档 |
| **PyMuPDF (fitz)** | Python 库 | AGPL-3.0 / 商业许可 | https://github.com/pymupdf/PyMuPDF | 极速 PDF 渲染与操作工具（PDF转高保真图片、合并、拆分、水印等） |
| **Pillow (PIL)** | Python 库 | HPND License | https://github.com/python-pillow/Pillow | 图像处理库，用于多格式图片转换与拼接成 PDF |
| **openpyxl** | Python 库 | MIT License | https://foss.heptapod.net/openpyxl/openpyxl | 读取与生成 Excel (.xlsx) 表格数据 |
| **python-pptx** | Python 库 | MIT License | https://github.com/scanny/python-pptx | 创建与操作 PowerPoint (.pptx) 演示文稿 |
| **pdfplumber** | Python 库 | MIT License | https://github.com/jsvine/pdfplumber | 提取 PDF 中精细表格与字符坐标信息 |
| **PaddlePaddle** | 深度学习底座 | Apache-2.0 | https://github.com/PaddlePaddle/Paddle | 飞桨开源深度学习平台（Phase 5 OCR 底座） |
| **PaddleOCR** | OCR 引擎 | Apache-2.0 | https://github.com/PaddlePaddle/PaddleOCR | 多语言精准文本检测与识别、版面分析与表格识别（Phase 5~6） |
| **Next.js** | 前端框架 | MIT License | https://github.com/vercel/next.js | 基于 React 的现代化全栈前端框架 |
| **React** | 前端 UI | MIT License | https://github.com/facebook/react | 用于构建用户界面的核心 UI 库 |
| **Tailwind CSS** | CSS 样式框架 | MIT License | https://github.com/tailwindlabs/tailwindcss | 实用优先的高效响应式 CSS 样式体系 |
| **Lucide Icons** | 图标库 | ISC License | https://github.com/lucide-icons/lucide | 现代化高颜值矢量图标组件 |
| **httpx** | HTTP 客户端 | BSD 3-Clause | https://github.com/encode/httpx | 用于后端与 Gotenberg 通信的异步/同步 HTTP 客户端 |

---

### 使用合规说明
1. 本地私有化运行：所有组件均打包于使用者本地的 Docker 容器中执行，不涉及向公网云端分发或多租户 SaaS 部署。
2. 许可证隔离：若在商业闭源产品中分发含有 GPL-3.0 或 AGPL-3.0 许可的库（如 pdf2docx, PyMuPDF），请遵循相应开源许可证或评估替换为 MIT/Apache 替代方案（例如基于 pypdf/pymupdf-commercial）。
