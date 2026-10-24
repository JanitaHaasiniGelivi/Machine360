# MachineMind 360 - Windows PowerShell Launcher
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " Launching MachineMind 360 Full-Stack Application" -ForegroundColor Cyan
Write-Host " Backend API: http://127.0.0.1:8000" -ForegroundColor Cyan
Write-Host " API Docs:    http://127.0.0.1:8000/docs" -ForegroundColor Cyan
Write-Host " Frontend:    http://127.0.0.1:5173" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

if (-not (Test-Path "$RootDir\backend\.venv\Scripts\python.exe")) {
    Write-Error "Backend virtual environment is missing or incompatible. Run .\scripts\setup_windows.ps1 first."
    exit 1
}

# Launch Backend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootDir\backend'; & .\.venv\Scripts\Activate.ps1; `$env:PYTHONPATH='.'; python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000"

# Launch Frontend in new window
Start-Process powershell -ArgumentList "-NoExit", "-Command", "Set-Location '$RootDir\frontend'; npm run dev -- --host 127.0.0.1 --port 5173"

Write-Host "Both servers launched in separate console windows." -ForegroundColor Green
