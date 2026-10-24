# MachineMind 360 - Windows PowerShell Setup Script
$ErrorActionPreference = "Stop"

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " MachineMind 360 - Windows Setup & Initialization" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir
Set-Location $RootDir

# 1. Check Python
Write-Host "-> Checking Python installation..." -ForegroundColor Yellow
$PythonCmd = (Get-Command python -ErrorAction SilentlyContinue)
if (-not $PythonCmd) {
    Write-Error "Python 3 is not found in PATH. Please install Python 3.12+."
    exit 1
}
Write-Host "   Found: $(python --version)"

# 2. Check Node & npm
Write-Host "-> Checking Node & npm..." -ForegroundColor Yellow
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
    Write-Error "Node.js is not installed."
    exit 1
}
Write-Host "   Found Node $(node -v) and npm $(npm -v)"

# 3. Setup Backend Virtual Environment
Write-Host "-> Setting up Python virtual environment..." -ForegroundColor Yellow
Set-Location "$RootDir\backend"
if (-not (Test-Path ".venv")) {
    python -m venv .venv
}
& .\.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
python -m pip install -r requirements.txt

# 4. Train ML Pipeline and verify artifacts
Write-Host "-> Verifying ML Pipeline and model training..." -ForegroundColor Yellow
Set-Location $RootDir
if (-not (Test-Path "ml\artifacts\model_pipeline.joblib")) {
    $env:PYTHONPATH = "backend"
    & "$RootDir\backend\.venv\Scripts\python.exe" "ml\scripts\train.py"
} else {
    Write-Host "   ML model artifacts already trained and persisted." -ForegroundColor Green
}

# 5. Database Migrations and Seeding
Write-Host "-> Applying database migrations and seeding initial records..." -ForegroundColor Yellow
Set-Location "$RootDir\backend"
$env:PYTHONPATH = "."
& .\.venv\Scripts\alembic.exe upgrade head
& .\.venv\Scripts\python.exe app\db\seed.py

# 6. Setup Frontend
Write-Host "-> Installing Frontend dependencies..." -ForegroundColor Yellow
Set-Location "$RootDir\frontend"
npm install

Write-Host ""
Write-Host "==========================================================" -ForegroundColor Green
Write-Host " Setup Completed Successfully!" -ForegroundColor Green
Write-Host " Run .\scripts\run_windows.ps1 to launch MachineMind 360." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
