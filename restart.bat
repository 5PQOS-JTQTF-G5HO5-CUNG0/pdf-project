@echo off
cd /d "%~dp0"

echo ========================================================
echo               LocalPDF - Restarting Services
echo ========================================================
echo [1/2] Rebuilding and updating frontend...
docker compose up -d --build frontend
echo [2/2] Restarting all services...
docker compose restart
echo ========================================================
echo [SUCCESS] LocalPDF services restarted!
echo URL: http://localhost:8080
echo ========================================================
echo.
pause
