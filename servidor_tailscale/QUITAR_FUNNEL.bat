@echo off
chcp 65001 >nul
set TS="%ProgramFiles%\Tailscale\tailscale.exe"
%TS% funnel reset
%TS% funnel status
echo Funnel desactivado: el servidor vuelve a ser solo para Tailscale.
pause
