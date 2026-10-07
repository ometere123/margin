$ErrorActionPreference = 'Stop'
$repo = Split-Path -Parent (Split-Path -Parent $PSScriptRoot)
$deadline = [DateTimeOffset]::Parse('2026-10-07T01:55:39.167911+00:00')
$log = Join-Path $repo 'scripts/live/evidence/V2-resume.log'
while ([DateTimeOffset]::UtcNow -lt $deadline) {
  Start-Sleep -Seconds 60
}
Set-Location $repo
& node scripts/live/resume-v2-covered.mjs *>> $log
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
