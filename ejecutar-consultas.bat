@echo off
echo Ejecutando consultas SQL desde consultas-directas.sql...
echo.

REM Ruta al cliente de MariaDB
set MYSQL_CLIENT=mariadb\bin\mariadb.exe

REM Parámetros de conexión
set DB_USER=ai
set DB_PASS=0260
set DB_NAME=operator_insight

REM Ejecutar consultas desde el archivo SQL
%MYSQL_CLIENT% -u%DB_USER% -p%DB_PASS% %DB_NAME% < consultas-directas.sql

echo.
echo Consultas ejecutadas correctamente.
pause
