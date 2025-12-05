# Stoppe alle Node-Prozesse
Write-Host "Stopping all Node processes..." -ForegroundColor Yellow

Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "All Node processes stopped!" -ForegroundColor Green
Write-Host "Ports 5000 and 5002 are now free." -ForegroundColor Cyan
