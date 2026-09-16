import time
from typing import Dict, Optional, List
from app.models.schemas import TaskInfo, TaskStatus

class TaskManager:
    def __init__(self):
        self._tasks: Dict[str, TaskInfo] = {}

    def create_task(self, task_id: str, source_filename: str, target_format: str) -> TaskInfo:
        task = TaskInfo(
            task_id=task_id,
            status=TaskStatus.PENDING,
            progress=0,
            source_filename=source_filename,
            target_format=target_format,
            created_at=time.time()
        )
        self._tasks[task_id] = task
        return task

    def get_task(self, task_id: str) -> Optional[TaskInfo]:
        return self._tasks.get(task_id)

    def set_status(self, task_id: str, status: TaskStatus, progress: Optional[int] = None):
        if task_id in self._tasks:
            self._tasks[task_id].status = status
            if progress is not None:
                self._tasks[task_id].progress = progress

    def set_progress(self, task_id: str, progress: int):
        if task_id in self._tasks:
            self._tasks[task_id].progress = min(100, max(0, progress))
            if self._tasks[task_id].status == TaskStatus.PENDING:
                self._tasks[task_id].status = TaskStatus.PROCESSING

    def mark_completed(self, task_id: str, output_filename: str, download_url: str):
        if task_id in self._tasks:
            task = self._tasks[task_id]
            task.status = TaskStatus.COMPLETED
            task.progress = 100
            task.output_filename = output_filename
            task.download_url = download_url
            task.finished_at = time.time()

    def mark_failed(self, task_id: str, error_message: str):
        if task_id in self._tasks:
            task = self._tasks[task_id]
            task.status = TaskStatus.FAILED
            task.error_message = error_message
            task.finished_at = time.time()

    def cleanup_old_tasks(self, success_ttl_seconds: float, failed_ttl_seconds: float):
        now = time.time()
        to_delete = []
        for task_id, task in self._tasks.items():
            if task.status == TaskStatus.COMPLETED and task.finished_at:
                if now - task.finished_at > success_ttl_seconds:
                    to_delete.append(task_id)
            elif task.status == TaskStatus.FAILED and task.finished_at:
                if now - task.finished_at > failed_ttl_seconds:
                    to_delete.append(task_id)
            elif task.status in (TaskStatus.PENDING, TaskStatus.PROCESSING):
                # 异常僵尸任务超过24小时也清理
                if now - task.created_at > failed_ttl_seconds:
                    to_delete.append(task_id)

        for task_id in to_delete:
            del self._tasks[task_id]

task_manager = TaskManager()
