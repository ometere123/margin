param(
  [Parameter(Mandatory = $true)][ValidateSet('A','B','C')][string]$Sequence,
  [Parameter(Mandatory = $true)][string]$ClaimKey,
  [string]$ProofUrl = 'https://margin-signer.vercel.app/.well-known/margin.json',
  [string]$ProofNonce,
  [string]$ProofExpiry = '2027-01-01T00:00:00+00:00',
  [string]$Beneficiary,
  [string]$ReleaseExpiry = '2027-01-02T00:00:00+00:00',
  [string]$EvidenceFile = 'scripts/live/current-run.txt'
)

$ErrorActionPreference = 'Stop'
$Margin = '0x0f8D86d56F1b8997475dD048579807fBFe60e227'
$Consumer = '0x603FF16d4ba5d9Ac8bb66af8fF6869EbFA272254'
$Cli = 'npm exec -- genlayer'

function Invoke-Gl([string]$Command) {
  Add-Content -LiteralPath $EvidenceFile -Value "`n> $Command"
  $output = Invoke-Expression $Command 2>&1 | Out-String
  Add-Content -LiteralPath $EvidenceFile -Value $output
  $output
}

New-Item -ItemType File -Force -Path $EvidenceFile | Out-Null
Add-Content -LiteralPath $EvidenceFile -Value "MARGIN live sequence $Sequence started $(Get-Date -AsUTC -Format o)"
Add-Content -LiteralPath $EvidenceFile -Value "network=studionet chain=61999 margin=$Margin consumer=$Consumer"

switch ($Sequence) {
  'A' {
    if (-not $ProofNonce) { throw 'A requires -ProofNonce matching the deployed HTTPS domain proof.' }
    Invoke-Gl "$Cli write $Margin register_assured_claim --args $ClaimKey $ProofUrl $ProofNonce $ProofExpiry"
    Write-Host 'Wait the full 24-hour registration challenge window, then run the following commands with the returned claim key:'
    Write-Host "$Cli receipt <register-tx>"
    Write-Host "$Cli write $Margin cancel_assured_claim --args $ClaimKey"
    Write-Host "$Cli write $Margin withdraw_assured_credit --args $ClaimKey"
    Write-Host "$Cli call $Margin get_assured_claim --args $ClaimKey"
  }
  'B' {
    if (-not $ProofNonce) { throw 'B requires -ProofNonce matching the deployed HTTPS domain proof.' }
    Invoke-Gl "$Cli write $Margin register_assured_claim --args $ClaimKey $ProofUrl $ProofNonce $ProofExpiry"
    Write-Host 'Challenge from a second wallet, resolve immediately, then wait the appeal window before settlement:'
    Write-Host "$Cli account use <challenger-account>"
    Write-Host "$Cli write $Margin challenge_assured_claim --args $ClaimKey"
    Write-Host "$Cli write $Margin resolve_assured_claim --args $ClaimKey"
    Write-Host "$Cli write $Margin settle_assured_claim --args $ClaimKey"
    Write-Host "$Cli write $Margin withdraw_assured_credit --args $ClaimKey"
    Write-Host "$Cli call $Margin get_assured_claim --args $ClaimKey"
  }
  'C' {
    if (-not $Beneficiary) { throw 'C requires -Beneficiary.' }
    Invoke-Gl "$Cli write $Consumer create_protected_release --args $ClaimKey $Beneficiary $ReleaseExpiry"
    Write-Host 'Create this release before settlement, then complete the Assured lifecycle with separate publisher/challenger wallets.'
    Write-Host "$Cli write $Consumer execute_release --args <release-id>"
    Write-Host "$Cli write $Consumer withdraw_release_credit --args <release-id>"
    Write-Host "$Cli call $Consumer get_releases_for_claim --args $ClaimKey"
  }
}

Add-Content -LiteralPath $EvidenceFile -Value "Sequence $Sequence is pending until every printed transaction is finalized and canonical readbacks are recorded."
