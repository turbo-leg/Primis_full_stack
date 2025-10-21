# PowerShell script to exclude .next and node_modules from OneDrive sync

Write-Host "Stopping any running Node processes..." -ForegroundColor Yellow
Stop-Process -Name "node" -Force -ErrorAction SilentlyContinue

Write-Host "Removing .next folder..." -ForegroundColor Yellow
if (Test-Path ".next") {
    Remove-Item -Path ".next" -Recurse -Force -ErrorAction SilentlyContinue
}

Write-Host "Setting OneDrive exclusion attributes..." -ForegroundColor Yellow

# Create .next folder if it doesn't exist
New-Item -Path ".next" -ItemType Directory -Force | Out-Null

# Set the folder to not sync with OneDrive
attrib +U ".next" /S /D

# Also exclude node_modules if needed
if (Test-Path "node_modules") {
    attrib +U "node_modules" /S /D
}

Write-Host "`nDone! The .next folder will no longer be synced with OneDrive." -ForegroundColor Green
Write-Host "You can now run 'npm run dev' again." -ForegroundColor Green
