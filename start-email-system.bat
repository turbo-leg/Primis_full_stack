@echo off
REM Email System Testing - Quick Start Script
REM This script starts all required services in separate windows

echo.
echo ============================================================
echo   College Prep Platform - Email System Quick Start
echo ============================================================
echo.

setlocal enabledelayedexpansion

REM Check if Docker and services are running
echo Checking prerequisites...

REM Start Backend API
echo.
echo Starting Backend API on http://localhost:8000...
start "Backend API" cmd /k "cd backend && C:\Users\tubul\OneDrive\Documents\Primis\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8000"

timeout /t 2 /nobreak

REM Start Celery Worker
echo Starting Celery Worker...
start "Celery Worker" cmd /k "cd backend && C:\Users\tubul\OneDrive\Documents\Primis\.venv\Scripts\celery.exe -A app.services.celery_app worker --loglevel=info"

timeout /t 2 /nobreak

REM Start Celery Beat
echo Starting Celery Beat (Scheduler)...
start "Celery Beat" cmd /k "cd backend && C:\Users\tubul\OneDrive\Documents\Primis\.venv\Scripts\celery.exe -A app.services.celery_app beat --loglevel=info"

timeout /t 2 /nobreak

REM Start Frontend
echo Starting Frontend on http://localhost:3000...
start "Frontend" cmd /k "cd frontend && npm run dev"

echo.
echo ============================================================
echo   Services Starting...
echo ============================================================
echo.
echo Backend API:     http://localhost:8000
echo API Docs:        http://localhost:8000/docs
echo Frontend:        http://localhost:3000
echo.
echo Test Password Reset:
echo   1. Go to http://localhost:3000/forgot-password
echo   2. Enter test email
echo   3. Check http://localhost:8000/docs for API docs
echo.
echo Press Ctrl+C in any window to stop that service
echo ============================================================
echo.

pause
