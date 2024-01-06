param (
    [string]$targetDeviceId
)
Write-Host "TargetDevice: $targetDeviceId" 
if (!($targetDeviceId)) {
    Set-AudioDevice 'Default'
    Write-Host 'Audio switched to default device'
} else {
    Set-AudioDevice $targetDeviceId
    Write-Host "Audio switched to $targetDeviceId"
}