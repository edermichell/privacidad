@echo off
chcp 65001 >nul
cd /d "%~dp0"
set PUERTO=8080
for /f "tokens=2 delims=:, " %%a in ('findstr /i "\"puerto\"" config.json') do set PUERTO=%%a
start "" "http://127.0.0.1:%PUERTO%/admin"
