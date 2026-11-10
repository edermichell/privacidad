@echo off
chcp 65001 >nul
rem Inicia el servidor automaticamente al iniciar sesion en Windows.
schtasks /create /tn "UltimoRefugioServidor" /tr "\"%~dp0INICIAR_SERVIDOR.bat\"" /sc onlogon /f
echo Listo: el servidor arrancara al iniciar sesion. Para quitarlo: QUITAR_AUTOARRANQUE.bat
echo Consejo: activa el inicio de sesion automatico de Windows si este equipo se reinicia solo.
pause
