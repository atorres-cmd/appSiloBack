@echo off
echo Actualizando estructura de la tabla TLV1_Status...
cd C:\Users\ASG\Downloads\mariadb-11.7.2-winx64\bin
mysql.exe -u ai -p0260 < "C:\Users\ASG\Documents\10_WindSurf\10-V0\operator-insight-backend\update-tlv1-table-add-fields.sql"
echo Estructura de la tabla actualizada correctamente.
pause
