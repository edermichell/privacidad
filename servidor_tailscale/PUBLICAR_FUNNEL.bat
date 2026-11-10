@echo off
chcp 65001 >nul
rem Publica el servidor en internet con Tailscale Funnel (HTTPS). Los jugadores NO necesitan Tailscale.
rem Requisitos: Tailscale iniciado; MagicDNS y HTTPS activados en el panel de Tailscale (ya los tienes); Funnel permitido (Tailscale te mostrara un enlace si falta).
if not exist "%ProgramFiles%\Tailscale\tailscale.exe" ( echo No se encontro Tailscale. & pause & exit /b 1 )
set TS="%ProgramFiles%\Tailscale\tailscale.exe"
set PUERTO=8080
%TS% funnel --bg %PUERTO%
echo.
%TS% funnel status
echo.
echo Si arriba aparece una direccion https://...ts.net, esa es la direccion publica.
echo Ponla en config.json ("urlPublica") y reinicia el servidor. Para quitarla: QUITAR_FUNNEL.bat
pause
