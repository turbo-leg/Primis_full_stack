# Test Password Reset Flow
Write-Host "Testing Password Reset Flow" -ForegroundColor Cyan
Write-Host ("=" * 60)

# Configuration
$API_URL = "https://primis-full-stack.onrender.com"  # Your production API
$TEST_EMAIL = "tubulol12345@gmail.com"

# Step 1: Request password reset
Write-Host "`n1️⃣ Requesting password reset for: $TEST_EMAIL" -ForegroundColor Yellow

try {
    $body = @{
        email = $TEST_EMAIL
    } | ConvertTo-Json

    $response = Invoke-RestMethod -Method POST `
        -Uri "$API_URL/api/v1/auth/forgot-password" `
        -ContentType "application/json" `
        -Body $body `
        -ErrorAction Stop

    Write-Host "✅ SUCCESS!" -ForegroundColor Green
    Write-Host "Response: $($response.message)" -ForegroundColor White
    Write-Host ""
    Write-Host ("=" * 60)
    Write-Host "NEXT STEPS:" -ForegroundColor Cyan
    Write-Host ("=" * 60)
    Write-Host "1. Check your email inbox at: $TEST_EMAIL"
    Write-Host "2. Look for email from: College Prep Platform"
    Write-Host "3. Click the reset link OR copy the token"
    Write-Host ""
    Write-Host "4. To reset password with token:" -ForegroundColor Yellow
    Write-Host '   $token = "PASTE_TOKEN_HERE"'
    Write-Host '   $resetBody = @{token=$token; new_password="newpass123"; confirm_password="newpass123"} | ConvertTo-Json'
    Write-Host "   Invoke-RestMethod -Method POST -Uri `"$API_URL/api/v1/auth/reset-password`" -ContentType `"application/json`" -Body `$resetBody"
    Write-Host ""
    Write-Host "Email should arrive within 1-2 minutes" -ForegroundColor Green
    
}
catch {
    Write-Host "❌ ERROR!" -ForegroundColor Red
    Write-Host "Status: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Message: $($_.Exception.Message)"
    
    if ($_.ErrorDetails.Message) {
        Write-Host "Details: $($_.ErrorDetails.Message)"
    }
}

Write-Host ""
Write-Host ("=" * 60)
Write-Host "Note: No Redis/Celery needed - emails sent directly!" -ForegroundColor Cyan
Write-Host ("=" * 60)
