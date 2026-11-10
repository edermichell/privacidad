@echo off
chcp 65001 >nul
cd /d "%~dp0"
set /p DIAS="Dias de duracion (ej. 30): "
set /p SALAS="Cuantas salas podra tener (ej. 3): "
node servidor.js --licencia %DIAS% %SALAS%
echo.
echo Copia el codigo y entregaselo al jugador. Funciona aunque el servidor este encendido.
pause
