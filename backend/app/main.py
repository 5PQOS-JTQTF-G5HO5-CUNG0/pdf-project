import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.health import router as health_router
from app.api.convert import router as convert_router
from app.api.pdf_tools import router as pdf_tools_router
from app.api.tasks import router as tasks_router
from app.api.files import router as files_router
from app.api.settings import router as settings_router
from app.utils.cleaner import start_periodic_cleaner

# 配置日志格式
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [%(name)s] %(message)s"
)
logger = logging.getLogger("main")

@asynccontextmanager
async def lifespan(app: FastAPI):
    # 启动后台定期清理任务
    cleaner_task = asyncio.create_task(start_periodic_cleaner())
    logger.info("LocalPDF Backend started successfully.")
    try:
        yield
    finally:
        cleaner_task.cancel()
        logger.info("LocalPDF Backend shutdown.")

app = FastAPI(
    title="LocalPDF Backend API",
    description="Windows 本地安全隐私文件转换与 PDF 工具服务",
    version="1.0.0",
    lifespan=lifespan
)

# 允许跨域
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 全局异常捕获，防止向客户端暴露 Python traceback
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.exception(f"Unhandled server error during {request.method} {request.url}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error_code": "INTERNAL_SERVER_ERROR",
            "message": "服务器内部处理异常，详情请查看后端运行日志。"
        }
    )

# 注册 API 路由
app.include_router(health_router, prefix="/api")
app.include_router(convert_router, prefix="/api")
app.include_router(pdf_tools_router, prefix="/api")
app.include_router(tasks_router, prefix="/api")
app.include_router(files_router, prefix="/api")
app.include_router(settings_router, prefix="/api")
