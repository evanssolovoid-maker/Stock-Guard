# PowerShell script to run both frontend and backend
Write-Host "Starting both Frontend and Backend..." -ForegroundColor Green
Write-Host ""
Write-Host "Frontend will run on http://localhost:5173" -ForegroundColor Cyan
Write-Host "Backend will run on http://localhost:3000" -ForegroundColor Magenta
Write-Host ""
Write-Host "Press Ctrl+C to stop both servers" -ForegroundColor Yellow
Write-Host ""

# Start frontend in background job
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    npm run dev:frontend
}

# Start backend in background job  
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD
    Set-Location backend
    npm run dev
}

# Wait for user interrupt
try {
    Write-Host "Both servers are running. Press Ctrl+C to stop..." -ForegroundColor Green
    while ($true) {
        Start-Sleep -Seconds 1
        Receive-Job -Job $frontendJob -ErrorAction SilentlyContinue
        Receive-Job -Job $backendJob -ErrorAction SilentlyContinue
    }
}
finally {
    Write-Host "`nStopping servers..." -ForegroundColor Yellow
    Stop-Job -Job $frontendJob, $backendJob
    Remove-Job -Job $frontendJob, $backendJob
    Write-Host "Servers stopped." -ForegroundColor Green
}


