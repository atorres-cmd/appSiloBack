@echo off
echo ===================================================
echo    Probando API del Puente Transferidor
echo ===================================================
echo.
echo Sincronizando datos desde el PLC...
echo.

curl -X POST http://localhost:3003/api/puente/sync

echo.
echo.
echo Obteniendo estado actual...
echo.

curl http://localhost:3003/api/puente

echo.
echo.
echo Prueba finalizada.
pause
