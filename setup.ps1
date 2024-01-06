Install-PackageProvider -Name nuget -MinimumVersion 2.8.5.201 -scope CurrentUser -force
Set-PSRepository -Name 'PSGallery' -InstallationPolicy Trusted
Get-PSRepository
if(!(Get-Command Get-AudioDevice -errorAction SilentlyContinue)){Install-Module -Name AudioDeviceCmdlets}
