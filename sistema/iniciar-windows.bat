@echo off
cd /d "%~dp0"
title Sistema de gestion - Impulso Capital Ciudadano
where node >nul 2>nul || (echo Instale Node.js desde https://nodejs.org & pause & exit /b)
start "" http://localhost:3000
node --no-warnings server.js
pause
