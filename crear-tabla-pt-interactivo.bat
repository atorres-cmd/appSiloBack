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
echo   modo INT DEFAULT 1,
echo   ocupacion INT DEFAULT 0,
echo   averia INT DEFAULT 0,
echo   matricula INT DEFAULT 0,
echo   pasillo_actual INT DEFAULT 6,
echo   x_actual INT DEFAULT 0,
echo   y_actual INT DEFAULT 0,
echo   z_actual INT DEFAULT 0,
echo   estadoFinOrden INT DEFAULT 0,
echo   resultadoFinOrden INT DEFAULT 0,
echo   timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
echo );
echo.
echo INSERT INTO PT_Status (modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual, estadoFinOrden, resultadoFinOrden)
echo SELECT 1, 0, 0, 0, 6, 0, 0, 0, 0, 0
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
