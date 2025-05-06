@echo off
echo ===================================================
echo    Insertando datos de prueba en la tabla PT_Status
echo ===================================================
echo.
echo Conectando a la base de datos operator_insight...
echo.

cd C:\Users\ASG\Downloads\mariadb-11.7.2-winx64\bin
mysql.exe -u ai -p0260 operator_insight < "C:\Users\ASG\Documents\10_WindSurf\10-V0\operator-insight-backend\insertar-datos-pt.sql"

echo.
echo Datos insertados correctamente.
pause
