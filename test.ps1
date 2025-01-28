
Set-Location -Path "contract"

Start-Process powershell -ArgumentList "npx hardhat node" -NoNewWindow
Start-Sleep -Seconds 5

npx hardhat ignition deploy ./ignition/modules/deploy.ts --network localhost

npx hardhat run scripts/demo.js --network localhost

Write-Host "Appuyez sur une touche pour terminer..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
Get-Process | Where-Object {$_.Name -eq "node" -and $_.CommandLine -like "*hardhat node*"} | Stop-Process