@echo off
chcp 65001 >nul
cd /d "%~dp0"
echo ==============================================
echo  Ultimo Refugio - instalacion del servidor
echo ==============================================
where winget >nul 2>nul
if errorlevel 1 (
  echo No se encontro "winget". Instala manualmente Node.js LTS ^(nodejs.org^) y Tailscale ^(tailscale.com/download^) y vuelve a ejecutar este archivo.
  pause & exit /b 1
)
where node >nul 2>nul
if errorlevel 1 (
  echo Instalando Node.js LTS...
  winget install -e --id OpenJS.NodeJS.LTS --accept-package-agreements --accept-source-agreements
)
where tailscale >nul 2>nul
if errorlevel 1 (
  if not exist "%ProgramFiles%\Tailscale\tailscale.exe" (
    echo Instalando Tailscale...
    winget install -e --id Tailscale.Tailscale --accept-package-agreements --accept-source-agreements
  )
)
where node >nul 2>nul
if errorlevel 1 (
  echo.
  echo Node.js se acaba de instalar pero esta ventana aun no lo ve.
  echo CIERRA esta ventana y vuelve a ejecutar INSTALAR_WINDOWS.bat.
  pause & exit /b 1
)
echo Instalando componentes del servidor...
call npm install --omit=dev
if errorlevel 1 ( echo Fallo npm install. Revisa tu conexion a internet. & pause & exit /b 1 )
if not exist config.json copy config.ejemplo.json config.json >nul
echo.
echo LISTO. Siguientes pasos:
echo  1. Abre Tailscale e inicia sesion (icono junto al reloj).
echo  2. Ejecuta ABRIR_FIREWALL_TAILSCALE.bat (como administrador) una sola vez.
echo  3. Ejecuta INICIAR_SERVIDOR.bat.
pause
