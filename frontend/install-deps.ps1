# Run once to install all project dependencies
Set-Location $PSScriptRoot
Write-Host "Installing dependencies..." -ForegroundColor Cyan
npm install
if ($LASTEXITCODE -eq 0) {
  Write-Host "Done! Run: npm run dev" -ForegroundColor Green
} else {
  Write-Host "Install failed. Check your network and Node.js install." -ForegroundColor Red
  exit 1
}
