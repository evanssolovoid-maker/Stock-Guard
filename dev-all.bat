@echo off
echo Starting both Frontend and Backend...
echo.
echo Frontend will run on http://localhost:5173
echo Backend will run on http://localhost:3000
echo.
echo Press Ctrl+C to stop both servers
echo.

start "Frontend - StockGuard" cmd /k "npm run dev:frontend"
timeout /t 2 /nobreak >nul
start "Backend - StockGuard" cmd /k "cd backend && npm run dev"

echo.
echo Both servers are starting in separate windows...
echo Close the windows or press Ctrl+C in each to stop them.
