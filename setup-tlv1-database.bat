@echo off
echo Configurando base de datos para TLV1_Status...
cd C:\Users\ASG\Downloads\mariadb-11.7.2-winx64\bin
mysql.exe -u root < "C:\Users\ASG\Documents\10_WindSurf\10-V0\operator-insight-backend\setup-tlv1-database.sql"
echo Base de datos configurada correctamente.
pause
