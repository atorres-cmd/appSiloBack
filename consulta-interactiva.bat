@echo off
echo ===================================================
echo    Consola interactiva de MariaDB para TLV1_Status
echo ===================================================
echo.
echo Conectando a la base de datos operator_insight...
echo.

cd C:\Users\ASG\Downloads\mariadb-11.7.2-winx64\bin
mysql.exe -u ai -p0260 operator_insight

echo.
echo Sesion finalizada.
pause
