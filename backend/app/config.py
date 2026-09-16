import os
from pathlib import Path
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    GOTENBERG_URL: str = os.getenv("GOTENBERG_URL", "http://gotenberg:3000")
    DATA_DIR: str = os.getenv("DATA_DIR", "/data")
    MAX_FILE_SIZE_MB: int = int(os.getenv("MAX_FILE_SIZE_MB", "500"))
    CLEANUP_SUCCESS_HOURS: int = int(os.getenv("CLEANUP_SUCCESS_HOURS", "1"))
    CLEANUP_FAILED_HOURS: int = int(os.getenv("CLEANUP_FAILED_HOURS", "24"))
    CLEANUP_INTERVAL_MINUTES: int = int(os.getenv("CLEANUP_INTERVAL_MINUTES", "15"))
    DEFAULT_DPI: int = int(os.getenv("DEFAULT_DPI", "300"))

    @property
    def max_file_size_bytes(self) -> int:
        return self.MAX_FILE_SIZE_MB * 1024 * 1024

    @property
    def input_dir(self) -> Path:
        p = Path(self.DATA_DIR) / "input"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def output_dir(self) -> Path:
        p = Path(self.DATA_DIR) / "output"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def temp_dir(self) -> Path:
        p = Path(self.DATA_DIR) / "temp"
        p.mkdir(parents=True, exist_ok=True)
        return p

    @property
    def logs_dir(self) -> Path:
        p = Path(self.DATA_DIR) / "logs"
        p.mkdir(parents=True, exist_ok=True)
        return p

settings = Settings()
