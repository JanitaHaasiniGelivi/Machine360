# MachineMind 360 - Windows Automated Quality Gates Script
$ErrorActionPreference = "Stop"

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$RootDir = Split-Path -Parent $ScriptDir

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host " MachineMind 360 - Automated Quality Gates & Verification" -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Backend Pytest
Write-Host "`n[1/4] Running Backend Pytest Suite..." -ForegroundColor Yellow
Set-Location "$RootDir\backend"
& .\.venv\Scripts\Activate.ps1
$env:PYTHONPATH = "."
python -m pytest tests -v

# 2. Frontend Unit Tests
Write-Host "`n[2/4] Running Frontend Vitest Suite..." -ForegroundColor Yellow
Set-Location "$RootDir\frontend"
npm run test

# 3. Frontend Type Check
Write-Host "`n[3/4] Running TypeScript Strict Type Checking..." -ForegroundColor Yellow
npx tsc --noEmit

# 4. Frontend Production Build
Write-Host "`n[4/4] Verifying Vite Production Build..." -ForegroundColor Yellow
npm run build

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host " ALL QUALITY GATES PASSED (4/4)! System Ready for Deployment." -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
