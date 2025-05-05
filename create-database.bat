@echo off
echo Creando base de datos y tablas para Operator Insight...
cd C:\Users\ASG\Downloads\mariadb-11.7.2-winx64\bin
mysql.exe -u root < "C:\Users\ASG\Documents\10_WindSurf\10-V0\operator-insight-backend\create-database.sql"
echo Base de datos y tablas creadas correctamente.
pause
