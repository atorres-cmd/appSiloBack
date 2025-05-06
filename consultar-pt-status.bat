@echo off
echo ===================================================
echo    Consultando datos de la tabla PT_Status
echo ===================================================
echo.
echo Conectando a la base de datos operator_insight...
echo.

cd C:\Users\ASG\Downloads\mariadb-11.7.2-winx64\bin
mysql.exe -u ai -p0260 operator_insight < "C:\Users\ASG\Documents\10_WindSurf\10-V0\operator-insight-backend\consultar-pt-status.sql"

echo.
echo Consulta finalizada.
pause
