param([string]$DeviceId = '')
$ErrorActionPreference = 'Stop'
$projectRoot = Split-Path $PSScriptRoot -Parent
$studioRoot = 'C:\Program Files\Huawei\DevEco Studio'
$hdcPath = Join-Path $studioRoot 'sdk\default\openharmony\toolchains\hdc.exe'
$hvigorPath = Join-Path $studioRoot 'tools\hvigor\bin\hvigorw.bat'
$devices = @(& $hdcPath list targets | Where-Object { $_.Trim() -and $_ -notmatch '\[Empty\]' })
if ($LASTEXITCODE -ne 0 -or $devices.Count -eq 0) { throw 'Start the DevEco emulator first.' }
if (-not $DeviceId) {
  if ($devices.Count -ne 1) { throw 'Multiple devices connected. Pass -DeviceId with the target ID.' }
  $DeviceId = $devices[0].Trim()
}
if ($DeviceId -notin $devices) { throw 'Requested device is not connected.' }
$env:DEVECO_SDK_HOME = Join-Path $studioRoot 'sdk'
Push-Location $projectRoot
try {
  & $hvigorPath assembleHap --mode module -p product=default -p module=entry@default -p buildMode=debug --no-daemon
  if ($LASTEXITCODE -ne 0) { throw 'Build failed.' }
  $hapPath = Join-Path $projectRoot 'entry\build\default\outputs\default\entry-default-unsigned.hap'
  & $hdcPath -t $DeviceId install -r $hapPath
  if ($LASTEXITCODE -ne 0) { throw 'Install failed.' }
  & $hdcPath -t $DeviceId shell aa start -a EntryAbility -b com.example.myapplicationnatpshoup
  if ($LASTEXITCODE -ne 0) { throw 'Launch failed.' }
} finally {
  Pop-Location
}
