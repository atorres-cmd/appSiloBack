@echo off
echo ===================================================
echo    Creando tabla PT_Status en MariaDB
echo ===================================================
echo.
echo Conectando a la base de datos operator_insight...
echo.

cd C:\Users\ASG\Downloads\mariadb-11.7.2-winx64\bin
mysql.exe -u ai -p0260 operator_insight

echo.
echo Ejecuta el siguiente comando SQL en la consola de MariaDB:
echo.
echo CREATE TABLE IF NOT EXISTS PT_Status (
echo   id INT AUTO_INCREMENT PRIMARY KEY,
echo   ocupacion INT DEFAULT 0, -- DB110,DBB30: 0=LIBRE 1=OCUPADO
echo   estado INT DEFAULT 0,    -- DB110,DBB31: 0=OK 1=AVERIA
echo   situacion INT DEFAULT 0, -- DB110,DBB32: 0=PARADO 1=EN MOVIMIENTO
echo   posicion INT DEFAULT 1,  -- DB110,DBB33: Posición actual (1-12)
echo   timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
echo );
echo.
echo INSERT INTO PT_Status (ocupacion, estado, situacion, posicion)
echo SELECT 0, 0, 0, 1
echo FROM DUAL
echo WHERE NOT EXISTS (SELECT 1 FROM PT_Status LIMIT 1);
echo.
echo DESCRIBE PT_Status;
echo.
echo SELECT * FROM PT_Status;
echo.
echo.
echo Sesion finalizada.
pause
