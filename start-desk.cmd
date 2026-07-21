@echo off
cd /d "%~dp0"
echo Stopping old Operation Desk service on port 4317 if it exists...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$deskPids = Get-NetTCPConnection -LocalPort 4317 -State Listen -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique; foreach ($processId in $deskPids) { if ($processId) { Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue } }"
set OPERATION_DESK_OPEN=1
npm.cmd run desk
if errorlevel 1 (
  echo.
  echo Operation Desk failed to start. See the error above.
  pause
)
