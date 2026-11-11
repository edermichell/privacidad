@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==========================================================
echo  PRUEBA DURA del mapa nuevo en TU PC (unos 3 minutos)
echo  - Cierra antes INICIAR_SERVIDOR.bat y las demas aplicaciones
echo  - Usa su propio servidor de prueba: NO toca tus salas ni mundos
echo  - Simula 3 salas x 10 jugadores peleando contra hordas
echo  - Al terminar copia el texto y mandamelo (tambien queda en
echo    resultado_prueba_dura.txt)
echo ==========================================================
node herramientas\prueba_dura.js
echo.
pause
