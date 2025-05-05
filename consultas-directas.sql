-- Archivo de consultas SQL para MariaDB
-- Para ejecutar estas consultas, usa el siguiente comando en cmd:
-- C:\Users\ASG\Downloads\mariadb-11.7.2-winx64\bin\mysql.exe -u ai -p0260 operator_insight < consultas-directas.sql

-- Seleccionar la base de datos
USE operator_insight;

-- 1. Ver todos los registros de TLV1_Status
SELECT * FROM TLV1_Status ORDER BY timestamp DESC;

-- 2. Insertar un nuevo registro (descomentar para usar)
/*
INSERT INTO TLV1_Status 
  (modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual) 
VALUES 
  (3, 1, 0, 1001, 4, 30, 15, 7);
*/

-- 3. Actualizar un registro existente (descomentar y modificar para usar)
/*
UPDATE TLV1_Status 
SET 
  modo = 1,
  ocupacion = 0,
  averia = 0
WHERE 
  id = 1;
*/

-- 4. Eliminar un registro (descomentar y modificar para usar)
/*
DELETE FROM TLV1_Status WHERE id = 2;
*/

-- 5. Consultas más complejas

-- 5.1 Contar registros por modo
SELECT modo, COUNT(*) as total FROM TLV1_Status GROUP BY modo;

-- 5.2 Encontrar el último registro para cada modo
SELECT t1.* 
FROM TLV1_Status t1
JOIN (
    SELECT modo, MAX(timestamp) as max_time
    FROM TLV1_Status
    GROUP BY modo
) t2 ON t1.modo = t2.modo AND t1.timestamp = t2.max_time;

-- 5.3 Estadísticas de posición
SELECT 
  AVG(x_actual) as promedio_x,
  AVG(y_actual) as promedio_y,
  AVG(z_actual) as promedio_z,
  MAX(x_actual) as max_x,
  MAX(y_actual) as max_y,
  MAX(z_actual) as max_z,
  MIN(x_actual) as min_x,
  MIN(y_actual) as min_y,
  MIN(z_actual) as min_z
FROM TLV1_Status;

-- 5.4 Registros con avería
SELECT * FROM TLV1_Status WHERE averia > 0 ORDER BY timestamp DESC;
