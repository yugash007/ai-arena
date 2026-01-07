[CmdletBinding()]
param(
  [Parameter(Mandatory=$false)][string]$Name = "API_KEY",
  [Parameter(Mandatory=$false)][string]$Value
)

function Get-EnvValue {
  param([string]$key)
  if (Test-Path ".env.local") {
    $match = Select-String -Path ".env.local" -Pattern ("^\s*" + [regex]::Escape($key) + "\s*=(.*)$") | Select-Object -First 1
    if ($match) { return $match.Matches[0].Groups[1].Value.Trim() }
  }
  return $null
}

# Try provided value, then .env.local API_KEY, then GEMINI_API_KEY
if ([string]::IsNullOrWhiteSpace($Value)) { $Value = Get-EnvValue $Name }
if ([string]::IsNullOrWhiteSpace($Value) -and $Name -eq "API_KEY") { $Value = Get-EnvValue "GEMINI_API_KEY" }
if ([string]::IsNullOrWhiteSpace($Value)) { $Value = Read-Host -Prompt "Enter value for $Name (comma-separated if multiple)" }

if ([string]::IsNullOrWhiteSpace($Value)) {
  Write-Error "No value provided for $Name. Aborting."
  exit 1
}

$envTargets = @("production", "preview", "development")
foreach ($t in $envTargets) {
  Write-Host "Adding $Name to $t..." -ForegroundColor Cyan
  try {
    # Pipe the value into the Vercel CLI to avoid exposing it in history
    $Value | vercel env add $Name $t | Write-Output
  }
  catch {
    Write-Warning "Failed to add $Name to $t. You can run: vercel env add $Name $t"
  }
}

Write-Host "Done. If values changed, redeploy with: vercel --prod" -ForegroundColor Green
