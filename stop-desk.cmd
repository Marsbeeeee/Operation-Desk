@echo off
echo Stopping Operation Desk service on port 4317...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$deskPids = Get-NetTCPConnection -LocalPort 4317 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; if (-not $deskPids) { Write-Host 'No Operation Desk service is listening on port 4317.'; exit 0 }; foreach ($processId in $deskPids) { Write-Host ('Stopping PID ' + $processId); Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue }"
echo Done.
pause
