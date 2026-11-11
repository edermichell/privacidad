@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==========================================================
echo  Volver al mapa anterior (restaura config.json y los mundos
echo  oficiales de la ultima copia de MIGRAR_A_MAPA_NUEVO.bat)
echo  Cierra antes la ventana de INICIAR_SERVIDOR.bat
echo ==========================================================
set /p OK="Escribe SI y ENTER para volver atras: "
if /I "%OK%"=="SI" (node herramientas\migrar_mapa_nuevo.js --revertir) else (echo Cancelado.)
echo.
pause
