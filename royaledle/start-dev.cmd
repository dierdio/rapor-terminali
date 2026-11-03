@echo off
set "VITE_NODE=C:\Users\ilhan\AppData\Local\Programs\nodejs-portable\node-v22.23.4-win-x64"
set "PATH=%VITE_NODE%\bin;%PATH%"
cd /d "%~dp0"
node node_modules\.bin\vite %*