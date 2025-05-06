@echo off
echo ===================================================
echo    Sincronizando datos del Puente Transferidor
echo ===================================================
echo.

curl -X POST http://localhost:3003/api/puente/sync

echo.
echo Sincronización finalizada.
pause
