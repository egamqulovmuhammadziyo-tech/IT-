@echo off
cd /d "%~dp0"
echo Beshariq IT Center ishga tushmoqda...

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js topilmadi. nodejs.org dan o'rnating.
  pause
  exit /b 1
)

:: Bo'sh port topish - 3001 dan boshlab
set PORT=3001
:CHECK_PORT
netstat -ano | findstr ":%PORT% " >nul 2>nul
if not errorlevel 1 (
  set /a PORT+=1
  if %PORT% gtr 3010 (
    echo Hech qanday bo'sh port topilmadi!
    pause
    exit /b 1
  )
  goto CHECK_PORT
)

echo Port %PORT% bo'sh - server shu portda ishga tushmoqda...
echo Brauzerda http://localhost:%PORT%/contact.html ochiladi...
start "" powershell -NoProfile -WindowStyle Hidden -Command "Start-Sleep -Seconds 2; Start-Process 'http://localhost:%PORT%/contact.html'"

set PORT=%PORT% && node server.js
pause
