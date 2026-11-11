@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==========================================================
echo  Pasar las 3 salas oficiales al MAPA NUEVO (960 x 960)
echo  - Cierra antes la ventana de INICIAR_SERVIDOR.bat
echo  - Se hace una copia de tus mundos y de config.json
echo  - Las salas creadas por jugadores NO se tocan
echo  - Para volver atras: VOLVER_AL_MAPA_ANTERIOR.bat
echo ==========================================================
node herramientas\migrar_mapa_nuevo.js
echo.
set /p OK="Escribe SI y ENTER para aplicar el cambio (otra cosa = cancelar): "
if /I "%OK%"=="SI" (node herramientas\migrar_mapa_nuevo.js --aplicar) else (echo Cancelado. No se cambio nada.)
echo.
pause
