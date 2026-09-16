import asyncio
import logging
import os
import shutil
import time
from pathlib import Path
from app.config import settings
from app.utils.task_manager import task_manager

logger = logging.getLogger("cleaner")

def clean_directory(dir_path: Path, success_ttl: float, failed_ttl: float):
    if not dir_path.exists():
        return

    now = time.time()
    for item in dir_path.iterdir():
        try:
            mtime = item.stat().st_mtime
            age = now - mtime
            # 如果对应任务在 task_manager 中有明确状态则按状态 TTL，否则按 failed_ttl 兜底
            task_id = item.name.split("_")[0] if "_" in item.name else item.name
            task = task_manager.get_task(task_id)

            ttl = success_ttl if (task and task.status == "completed") else failed_ttl
            if age > ttl:
                if item.is_dir():
                    shutil.rmtree(item, ignore_errors=True)
                else:
                    item.unlink(missing_ok=True)
                logger.info(f"Cleaned expired item: {item} (Age: {age:.0f}s, TTL: {ttl:.0f}s)")
        except Exception as e:
            logger.error(f"Error cleaning {item}: {e}")

async def start_periodic_cleaner():
    logger.info("Periodic file cleaner task started.")
    while True:
        try:
            success_ttl = settings.CLEANUP_SUCCESS_HOURS * 3600
            failed_ttl = settings.CLEANUP_FAILED_HOURS * 3600

            clean_directory(settings.input_dir, success_ttl, failed_ttl)
            clean_directory(settings.output_dir, success_ttl, failed_ttl)
            clean_directory(settings.temp_dir, 1800, 3600) # temp 目录 30 分钟即可清理

            task_manager.cleanup_old_tasks(success_ttl, failed_ttl)
        except Exception as e:
            logger.error(f"Unexpected error in file cleaner loop: {e}")

        # 每隔 settings.CLEANUP_INTERVAL_MINUTES 执行一次
        await asyncio.sleep(settings.CLEANUP_INTERVAL_MINUTES * 60)
