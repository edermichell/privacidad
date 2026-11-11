@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==========================================================
echo  Prueba de carga con jugadores simulados
echo  1) Asegurate de que INICIAR_SERVIDOR.bat esta abierto.
echo  2) Con el mapa nuevo: MIGRAR_A_MAPA_NUEVO.bat ya dejo 3 salas oficiales.
echo  3) No uses el PC para otra cosa durante la prueba (~2 min).
echo ==========================================================
set /p SALAS="Salas a probar (ENTER = SALA1,SALA2,SALA3): "
if "%SALAS%"=="" set SALAS=SALA1,SALA2,SALA3
set /p N="Jugadores simulados POR sala (ENTER = 10): "
if "%N%"=="" set N=10
node herramientas\probar_carga.js --salas %SALAS% --n %N% --seg 60
echo.
pause
