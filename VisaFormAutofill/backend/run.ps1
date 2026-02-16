# Run the Visa Form Autofill backend (PowerShell).
# From backend folder: .\run.ps1
# Installs dependencies into .venv if uvicorn is missing, then starts the server.

$ErrorActionPreference = "Stop"
Set-Location $PSScriptRoot

if (Test-Path ".venv\Scripts\Activate.ps1") {
    .\.venv\Scripts\Activate.ps1
}

# Ensure uvicorn (and deps) are installed in the current Python
$hasUvicorn = python -c "import uvicorn" 2>$null
if (-not $?) {
    Write-Host "Installing dependencies (pip install -r requirements.txt)..."
    pip install -r requirements.txt
    if (-not $?) { exit 1 }
}

python -m uvicorn app.main:app --reload
