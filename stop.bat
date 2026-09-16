@echo off
cd /d "%~dp0"

echo ========================================================
echo               LocalPDF - Stopping Services
echo ========================================================
echo.

docker compose down

echo.
echo ========================================================
echo [SUCCESS] LocalPDF services have been stopped.
echo ========================================================
echo.
pause
