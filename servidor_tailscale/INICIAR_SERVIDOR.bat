@echo off
chcp 65001 >nul
title Ultimo Refugio - servidor
cd /d "%~dp0"
:otra
node servidor.js
echo.
echo El servidor se detuvo. Reiniciando en 10 segundos... (cierra esta ventana para salir)
timeout /t 10 >nul
goto otra
