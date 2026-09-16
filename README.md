# LocalPDF — Windows 本地全能文件转换工具

> 纯本地运行 · 零云端数据上传 · 强隐私隔离 · 包含全套 PDF 处理工具箱

LocalPDF 是专为 Windows 10/11 打造的本地私有化文件转换与 PDF 处理工具。所有转换任务均在本地 Docker 容器中执行，无需联网上传至任何第三方云端服务，彻底杜绝企业与个人敏感数据外泄。

---

## ✨ 核心特性

- **数据绝对隐私**：所有文件上传、转换、渲染与下载均在本机 Docker 内完成，默认不对外发送任何数据。
- **全格式互转**：
  - **Office → PDF**：Word (`.doc`, `.docx`)、Excel (`.xls`, `.xlsx`)、PowerPoint (`.ppt`, `.pptx`)。基于 Gotenberg & LibreOffice 8 引擎，完美保留版式、表格与图表。
  - **PDF → Word**：基于 `pdf2docx` 智能对象级排版重建，提取文本段落与表格，绝非截图伪装。
  - **PDF ↔ 图片**：支持 JPG、PNG、WEBP 高清互转，可配置 150/300/600 DPI 精度，多页自动打包为 ZIP 或合成为多页 PDF。
- **PDF 专属工具箱**：
  - **合并 PDF**：多文件自定义顺序合并。
  - **拆分与提取**：支持指定页码范围提取（如 `1,3-5`）或整本拆分为单页压缩包。
  - **页面旋转**：90° / 180° / 270° 自由旋转。
  - **体积压缩**：智能流优化与可调画质压缩。
  - **加密与解密**：工业级 AES-256 口令加密与密码解除。
  - **文字防伪水印**：支持自定义文字、倾斜角度、透明度与字号。
- **安全与自动化运维**：
  - 文件名自动净化，彻底杜绝路径穿越（`..` 注入）与非法字符。
  - 扩展名、MIME Type 与 Magic Bytes 文件头三重深度防伪校验。
  - 任务与文件采用 UUID 目录隔离，内置自动化清理调度器（默认完成任务 1 小时自动彻底销毁，失败任务 24 小时清理）。
- **批量与高效**：支持多文件同时拖放上传、独立转换进度、失败一键重试与一键打包为 ZIP 归档下载。

---

## 🚀 快速启动

### 前置要求
- Windows 10 / 11 操作系统
- 已安装并启动 [Docker Desktop](https://www.docker.com/products/docker-desktop/)

### 一键启动
在项目根目录下，**直接双击运行 `start.bat`**：
1. 脚本会自动检查 Docker 环境并启动容器集群 (`frontend`, `backend`, `gotenberg`)。
2. 启动就绪后将**自动调用默认浏览器打开应用主页**：[http://localhost:8080](http://localhost:8080)。

### 常用运维脚本
- `start.bat`：启动所有服务并自动打开浏览器。
- `stop.bat`：安全停止所有容器服务。
- `restart.bat`：快速重启所有容器服务。
- `update.bat`：无缓存重新构建镜像并更新服务。

---

## 🛠️ 系统架构与技术栈

```mermaid
graph TD
  User([用户浏览器 Chrome / Edge]) -->|访问前端页面 :8080| Frontend[Next.js + Tailwind CSS]
  Frontend -->|API 任务请求 :8000| Backend[FastAPI + Uvicorn 异步服务]
  Backend -->|Office 转 PDF :3000| Gotenberg[Gotenberg 8 + LibreOffice]
  Backend -->|PDF 转 DOCX| PDF2DOCX[pdf2docx 引擎]
  Backend -->|PDF 转图 / 工具箱| PyMuPDF[PyMuPDF / Pillow]
  Backend -->|数据持久与隔离| Storage[./data 持久化目录 (UUID隔离/自动销毁)]
```

- **前端**：Next.js 14 (App Router) + React + TypeScript + Tailwind CSS + Lucide Icons。
- **后端**：Python 3.11 + FastAPI + Uvicorn + Pydantic + PyMuPDF + pdf2docx + Pillow。
- **文档引擎**：Gotenberg 8 (LibreOffice 官方无头微服务)。
- **部署模式**：Docker Compose 现代化容器编排。

---

## 📁 目录结构

```
LocalPDF/
├── docker-compose.yml          # Docker Compose 容器编排定义
├── .env.example                # 环境变量配置模板
├── .env                        # 本地环境变量
├── start.bat                   # 一键启动服务并打开浏览器
├── stop.bat                    # 停止服务
├── restart.bat                 # 重启服务
├── update.bat                  # 重新构建更新服务
├── THIRD_PARTY_LICENSES.md     # 第三方开源组件许可证清单
├── README.md                   # 项目使用与架构说明
├── frontend/                   # Next.js 前端源码
│   ├── app/                    # 页面与路由
│   ├── components/             # 界面组件 (DropZone, TaskCard, PdfTools 等)
│   ├── lib/                    # API 通信层
│   └── Dockerfile              # 前端多阶段构建 Dockerfile
├── backend/                    # FastAPI 后端源码
│   ├── app/
│   │   ├── api/                # API 路由 (convert, pdf_tools, tasks, files, health, settings)
│   │   ├── converters/         # 模块化转换器 (OfficeToPdf, PdfToDocx, PdfToImage 等)
│   │   ├── pdf_tools/          # PDF 专项工具 (merge, split, rotate, watermark 等)
│   │   ├── models/             # Pydantic 规范
│   │   └── utils/              # 安全拦截校验、任务池、周期文件清理
│   └── Dockerfile              # 后端运行 Dockerfile (集成中文字体包)
├── data/                       # 宿主机持久化与容器映射目录
│   ├── input/                  # 上传暂存区
│   ├── output/                 # 转换产物区
│   ├── temp/                   # 临时工作区
│   └── logs/                   # 后端日志区
└── tests/                      # 样本生成器与自动化测试套件
    ├── generate_samples.py     # PRD 规定样本文件自动生成器
    ├── test_converters.py      # 格式转换器自动化测试
    ├── test_pdf_tools.py       # PDF 工具箱功能测试
    └── test_security.py        # 安全与防注入测试
```

---

## 🧪 测试与验收

本项目内置完整的测试样本文档生成脚本与 pytest 回归测试套件：

1. **生成 PRD 第 13 节规定的全套测试样本**：
   ```bash
   python tests/generate_samples.py
   ```
   将在 `tests/samples/` 自动生成包含中文字体、复杂表格、多页演示文稿的测试样本（`simple.docx`, `complex.docx`, `table.xlsx`, `complex.xlsx`, `simple.pptx`, `complex.pptx`, `text.pdf`, `table.pdf`, `scan.pdf`, `invoice.pdf`, `image.jpg`, `image.png`）。

2. **执行自动化测试**：
   ```bash
   pytest tests/
   ```

---

## 📄 开源许可证
本项目遵循开源规范，第三方依赖库许可证详情请参见 [THIRD_PARTY_LICENSES.md](./THIRD_PARTY_LICENSES.md)。
