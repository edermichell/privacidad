@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==========================================================
echo  Añadir la sala oficial PvP («Frontera PvP», mapa 480)
echo  - Cierra antes la ventana de INICIAR_SERVIDOR.bat
echo  - Se hace una copia de config.json
echo  - Tus otras salas y sus mundos NO se tocan
echo ==========================================================
node herramientas\agregar_sala_pvp.js
echo.
set /p OK="Escribe SI y ENTER para aplicar el cambio (otra cosa = cancelar): "
if /I "%OK%"=="SI" (node herramientas\agregar_sala_pvp.js --aplicar) else (echo Cancelado. No se cambio nada.)
echo.
pause
