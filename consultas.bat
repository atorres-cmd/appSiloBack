@echo off
echo Ejecutando consultas SQL directamente...
echo.

REM Ruta al cliente de MariaDB
set MYSQL_CLIENT=mariadb\bin\mariadb.exe

REM Parámetros de conexión
set DB_USER=ai
set DB_PASS=0260
set DB_NAME=operator_insight

REM Ejecutar consultas específicas
%MYSQL_CLIENT% -u%DB_USER% -p%DB_PASS% %DB_NAME% -e "SHOW TABLES;"
echo.
echo === Datos de TLV1_Status ===
%MYSQL_CLIENT% -u%DB_USER% -p%DB_PASS% %DB_NAME% -e "SELECT * FROM TLV1_Status;"
echo.
echo === Datos de TLV2_Status ===
%MYSQL_CLIENT% -u%DB_USER% -p%DB_PASS% %DB_NAME% -e "SELECT * FROM TLV2_Status;"
echo.
echo === Datos de PT_Status ===
%MYSQL_CLIENT% -u%DB_USER% -p%DB_PASS% %DB_NAME% -e "SELECT * FROM PT_Status;"
echo.
echo === Conteo de registros por tabla ===
%MYSQL_CLIENT% -u%DB_USER% -p%DB_PASS% %DB_NAME% -e "SELECT 'TLV1_Status' as tabla, COUNT(*) as total FROM TLV1_Status UNION SELECT 'TLV2_Status' as tabla, COUNT(*) as total FROM TLV2_Status UNION SELECT 'PT_Status' as tabla, COUNT(*) as total FROM PT_Status;"

echo.
echo Consultas ejecutadas correctamente.
pause
