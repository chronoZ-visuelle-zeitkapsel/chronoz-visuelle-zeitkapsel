# ChronoZ - Entwicklungsumgebung starten
Write-Host "Starting ChronoZ Development Environment..." -ForegroundColor Green

# Starte Backend
Write-Host "`nStarting Backend on port 5000..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot\server'; node server.js"

# Warte kurz
Start-Sleep -Seconds 2

# Starte Frontend
Write-Host "Starting Frontend on port 5002..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; `$env:PORT=5002; npm start"

Write-Host "`nBoth servers starting..." -ForegroundColor Green
Write-Host "Backend: http://localhost:5000" -ForegroundColor Cyan
Write-Host "Frontend: http://localhost:5002" -ForegroundColor Cyan
Write-Host "`nPress any key to exit..." -ForegroundColor Gray
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
