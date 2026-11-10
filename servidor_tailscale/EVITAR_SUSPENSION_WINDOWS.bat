@echo off
chcp 65001 >nul
rem Para usar el portatil/PC como servidor: no suspender ni hibernar enchufado, y no hacer nada al cerrar la tapa.
powercfg /change standby-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
powercfg /change monitor-timeout-ac 10
powercfg /setacvalueindex SCHEME_CURRENT SUB_BUTTONS LIDACTION 0
powercfg /setactive SCHEME_CURRENT
echo Listo (solo cuando esta enchufado). Mantenlo conectado a la corriente y bien ventilado.
pause
