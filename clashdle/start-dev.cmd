@echo off
rem Clashdle gelistirme sunucusu (Vite)
rem Node taşinabilir surumda ise PATH'e eklenir, yoksa sistemdeki node kullanilir.
set "VITE_NODE=C:\Users\ilhan\AppData\Local\Programs\nodejs-portable\node-v22.23.4-win-x64"

if not exist "%VITE_NODE%\node.exe" (
  echo Not: taşinabilir Node bulunamadi, sistemdeki node deneniyor...
) else (
  set "PATH=%VITE_NODE%;%PATH%"
)

cd /d "%~dp0"

where node >nul 2>&1
if errorlevel 1 (
  echo HATA: Node.js bulunamadi. Lutfen Node kurun veya VITE_NODE yolunu duzeltin.
  pause
  exit /b 1
)

echo Clashdle dev sunucusu baslatiliyor: http://localhost:5183
node node_modules\.bin\vite %*
