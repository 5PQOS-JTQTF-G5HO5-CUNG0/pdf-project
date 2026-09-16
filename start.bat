@echo off
cd /d "%~dp0"

echo ========================================================
echo               LocalPDF Windows Launcher
echo ========================================================
echo.

echo [1/3] Preparing data folders...
if not exist "data\input" mkdir "data\input"
if not exist "data\output" mkdir "data\output"
if not exist "data\temp" mkdir "data\temp"
if not exist "data\logs" mkdir "data\logs"

echo.
echo [2/3] Starting Docker Compose services...
docker compose up -d
if errorlevel 1 goto error_handler

echo.
echo [3/3] Opening browser at http://localhost:8080 ...
timeout /t 3 /nobreak >nul
start http://localhost:8080

echo.
echo ========================================================
echo [SUCCESS] LocalPDF is running!
echo URL: http://localhost:8080
echo API: http://localhost:8000
echo.
echo To stop the application, double click stop.bat
echo ========================================================
echo.
pause
exit /b 0

:error_handler
echo.
echo ========================================================
echo [ERROR] Failed to start Docker containers!
echo Please ensure Docker Desktop is launched and running.
echo ========================================================
echo.
pause
exit /b 1
