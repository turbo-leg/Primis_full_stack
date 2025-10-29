# Check if Render deployment is complete
Write-Host "Checking deployment status..." -ForegroundColor Cyan

$API_URL = "https://primis-full-stack.onrender.com"

try {
    $response = Invoke-RestMethod -Uri "$API_URL/health" -TimeoutSec 10
    Write-Host "✅ Backend is UP!" -ForegroundColor Green
    Write-Host "Status: $($response.status)"
    Write-Host ""
    Write-Host "Ready to test password reset!" -ForegroundColor Yellow
    Write-Host "Run: .\test_password_reset.ps1"
}
catch {
    Write-Host "⏳ Backend not ready yet or still deploying..." -ForegroundColor Yellow
    Write-Host "Wait 1-2 minutes and try again"
}
