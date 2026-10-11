@echo off
REM ============================================================
REM  ActionGate - one-click dev launcher (backend + frontend)
REM  Starts both servers in their own titled windows.
REM ============================================================
title ActionGate Launcher

echo Starting backend (Express + MongoDB) on port 5001 ...
start "ActionGate Backend (5001)" cmd /k "cd /d c:\Users\durgu\vertexa_hac && npm run dev"

echo Starting frontend (Vite + React) on port 5173 ...
start "ActionGate Frontend (5173)" cmd /k "cd /d c:\Users\durgu\vertexa_hac\client && npm run dev"

echo.
echo ============================================================
echo   Backend : http://127.0.0.1:5001/health
echo   Frontend: http://localhost:5173/
echo ============================================================
echo Close the two server windows to stop the app.
pause
