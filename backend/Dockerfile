FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 安装必要的系统库和中文字体，防止中文乱码与渲染异常
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    curl \
    libgl1 \
    libglib2.0-0 \
    fonts-noto-cjk \
    fonts-wqy-zenhei \
    fonts-wqy-microhei \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖定义并安装
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制后端应用代码
COPY app/ /app/app/

# 创建本地数据目录挂载点
RUN mkdir -p /data/input /data/output /data/temp /data/logs

# 暴露 FastAPI 端口
EXPOSE 8000

# 启动 uvicorn
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
