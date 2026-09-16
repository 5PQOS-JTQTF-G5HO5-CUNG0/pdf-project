from fastapi import APIRouter, HTTPException
from app.utils.task_manager import task_manager
from app.models.schemas import TaskInfo

router = APIRouter(prefix="/tasks", tags=["Tasks"])

@router.get("/{task_id}", response_model=TaskInfo)
async def get_task_status(task_id: str):
    task = task_manager.get_task(task_id)
    if not task:
        raise HTTPException(status_code=404, detail=f"任务不存在: {task_id}")
    return task
