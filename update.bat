@echo off
cd /d "%~dp0"

echo ========================================================
echo               LocalPDF - Rebuilding and Updating
echo ========================================================
echo.

docker compose down
docker compose build --no-cache
docker compose up -d

echo.
echo ========================================================
echo [SUCCESS] LocalPDF updated and running!
echo URL: http://localhost:8080
echo ========================================================
echo.
pause
