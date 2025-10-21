# PowerShell script to initialize Alembic migrations
# Run this script from the backend directory

Write-Host "🔧 Initializing Alembic Migrations..." -ForegroundColor Cyan
Write-Host ""

# Check if we're in the backend directory
if (-not (Test-Path "alembic.ini")) {
    Write-Host "❌ Error: alembic.ini not found. Please run this script from the backend directory." -ForegroundColor Red
    Write-Host "Usage: cd backend; .\scripts\init_migrations.ps1" -ForegroundColor Yellow
    exit 1
}

# Check if DATABASE_URL is set
if (-not $env:DATABASE_URL) {
    Write-Host "⚠️  DATABASE_URL not set. Using default local database..." -ForegroundColor Yellow
    $env:DATABASE_URL = "postgresql://postgres:postgres@localhost:5432/college_prep"
}

Write-Host "📊 Database URL: $env:DATABASE_URL" -ForegroundColor Gray
Write-Host ""

# Check if migrations already exist
$migrationFiles = Get-ChildItem -Path "alembic\versions\*.py" -ErrorAction SilentlyContinue
if ($migrationFiles) {
    Write-Host "⚠️  Warning: Migration files already exist:" -ForegroundColor Yellow
    $migrationFiles | ForEach-Object { Write-Host "   - $($_.Name)" -ForegroundColor Gray }
    Write-Host ""
    $response = Read-Host "Do you want to create a new migration anyway? (y/N)"
    if ($response -ne 'y' -and $response -ne 'Y') {
        Write-Host "❌ Cancelled." -ForegroundColor Red
        exit 0
    }
}

Write-Host "📝 Generating initial migration from models..." -ForegroundColor Green
alembic revision --autogenerate -m "Initial migration - create all tables"

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Migration created successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "📋 Next steps:" -ForegroundColor Cyan
    Write-Host "   1. Review the generated migration file in alembic/versions/" -ForegroundColor White
    Write-Host "   2. Apply the migration: alembic upgrade head" -ForegroundColor White
    Write-Host "   3. Or use: python scripts/migrate.py upgrade" -ForegroundColor White
    Write-Host ""
    Write-Host "🐳 For Docker:" -ForegroundColor Cyan
    Write-Host "   docker-compose up -d  (migrations run automatically)" -ForegroundColor White
    Write-Host ""
    
    # List the created migration file
    $newMigration = Get-ChildItem -Path "alembic\versions\*.py" | Sort-Object LastWriteTime -Descending | Select-Object -First 1
    if ($newMigration) {
        Write-Host "📄 Created migration file:" -ForegroundColor Green
        Write-Host "   $($newMigration.Name)" -ForegroundColor Gray
    }
}
else {
    Write-Host ""
    Write-Host "❌ Failed to create migration. Check the error above." -ForegroundColor Red
    exit 1
}
