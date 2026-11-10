@echo off
chcp 65001 >nul
rem Permite el puerto del servidor SOLO desde direcciones de Tailscale (100.64.0.0/10). Ejecutar como administrador.
net session >nul 2>&1
if errorlevel 1 ( echo Haz clic derecho en este archivo y elige "Ejecutar como administrador". & pause & exit /b 1 )
set PUERTO=8080
netsh advfirewall firewall delete rule name="Ultimo Refugio (Tailscale)" >nul 2>&1
netsh advfirewall firewall add rule name="Ultimo Refugio (Tailscale)" dir=in action=allow protocol=TCP localport=%PUERTO% remoteip=100.64.0.0/10 profile=any
echo Regla creada para el puerto %PUERTO% (solo desde Tailscale). Si cambias "puerto" en config.json, edita PUERTO en este archivo y repite.
pause
