# Email System Testing - Quick Start Script (PowerShell)
# This script starts all required services

Write-Host "
============================================================
  College Prep Platform - Email System Quick Start
============================================================
" -ForegroundColor Cyan

$venvPath = "C:\Users\tubul\OneDrive\Documents\Primis\.venv\Scripts"
$backendPath = "backend"
$frontendPath = "frontend"

Write-Host "Starting all services..." -ForegroundColor Yellow
Write-Host ""

# Check if Docker is running (optional check)
try {
    $dockerRunning = docker ps 2>$null
    Write-Host "✓ Docker is available" -ForegroundColor Green
}
catch {
    Write-Host "⚠ Docker not running (optional for this test)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Starting services in separate windows..." -ForegroundColor Cyan
Write-Host ""

# Start Backend API
Write-Host "1. Starting Backend API on http://localhost:8000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; & '$venvPath\python.exe' -m uvicorn app.main:app --reload --port 8000" -WindowStyle Normal
Start-Sleep -Seconds 2

# Start Celery Worker
Write-Host "2. Starting Celery Worker..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; & '$venvPath\celery.exe' -A app.services.celery_app worker --loglevel=info" -WindowStyle Normal
Start-Sleep -Seconds 2

# Start Celery Beat
Write-Host "3. Starting Celery Beat (Scheduler)..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; & '$venvPath\celery.exe' -A app.services.celery_app beat --loglevel=info" -WindowStyle Normal
Start-Sleep -Seconds 2

# Start Frontend
Write-Host "4. Starting Frontend on http://localhost:3000..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$frontendPath'; npm run dev" -WindowStyle Normal

Write-Host "
============================================================
  All Services Starting...
============================================================

URLS:
  Backend API:     http://localhost:8000
  API Docs:        http://localhost:8000/docs
  Frontend:        http://localhost:3000

QUICK TEST:
  1. Go to http://localhost:3000/forgot-password
  2. Enter any test email address
  3. Check your inbox or Gmail (tubulol12345@gmail.com)
  4. Click the reset link
  5. Reset your password

API TESTING:
  - Visit http://localhost:8000/docs for interactive API docs
  - Use the 'Try it out' feature to test endpoints
  - All endpoints require proper authentication tokens

LOGS:
  - Each service opens in its own window
  - Close any window to stop that service
  - Watch for errors in the console output

============================================================
" -ForegroundColor Cyan

Write-Host "Services are starting. Check opened windows for logs." -ForegroundColor Yellow
Write-Host "Close this window when done testing." -ForegroundColor Yellow
