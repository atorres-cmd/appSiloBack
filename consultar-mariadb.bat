@echo off
echo Consultando MariaDB...
echo.

REM Ruta al cliente de MariaDB
set MYSQL_CLIENT=mariadb\bin\mysql.exe

REM Parámetros de conexión
set DB_USER=ai
set DB_PASS=0260
set DB_NAME=operator_insight

REM Verificar si se proporcionó un archivo SQL como parámetro
if "%1"=="" (
  echo Modo interactivo: Conectando a MariaDB...
  echo Para salir, escribe "exit" o presiona Ctrl+C
  echo.
  %MYSQL_CLIENT% -u%DB_USER% -p%DB_PASS% %DB_NAME%
) else (
  echo Ejecutando consultas desde el archivo %1...
  %MYSQL_CLIENT% -u%DB_USER% -p%DB_PASS% %DB_NAME% < %1
)

echo.
echo Consulta finalizada.
