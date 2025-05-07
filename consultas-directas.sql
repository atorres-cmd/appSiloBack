-- Archivo de consultas SQL para MariaDB
-- Para ejecutar estas consultas, usa el siguiente comando en cmd:
-- C:\Users\ASG\Downloads\mariadb-11.7.2-winx64\bin\mysql.exe -u ai -p0260 operator_insight < consultas-directas.sql

-- Seleccionar la base de datos
USE operator_insight;

-- CONSULTAS PARA VERIFICAR LA ESTRUCTURA ACTUAL DE LAS TABLAS
-- Mostrar todas las tablas
SHOW TABLES;

-- Mostrar la estructura de las tablas
DESCRIBE TLV1_Status;
DESCRIBE TLV2_Status;
DESCRIBE PT_Status;

-- CONSULTAS PARA VERIFICAR LOS DATOS ACTUALES (SIEMPRE ID=1)
-- Ver el registro actual de TLV1_Status (siempre id=1)
SELECT * FROM TLV1_Status WHERE id = 1;

-- Ver el registro actual de TLV2_Status (siempre id=1)
SELECT * FROM TLV2_Status WHERE id = 1;

-- Ver el registro actual de PT_Status (siempre id=1)
SELECT * FROM PT_Status WHERE id = 1;

-- CONSULTAS PARA VERIFICAR QUE SOLO HAY UNA FILA EN CADA TABLA
-- Contar registros en cada tabla
SELECT 'TLV1_Status' as tabla, COUNT(*) as total_registros FROM TLV1_Status
UNION
SELECT 'TLV2_Status' as tabla, COUNT(*) as total_registros FROM TLV2_Status
UNION
SELECT 'PT_Status' as tabla, COUNT(*) as total_registros FROM PT_Status;

-- CONSULTAS PARA ACTUALIZAR MANUALMENTE LOS DATOS (DESCOMENTAR PARA USAR)
-- Actualizar el registro de TLV1_Status
/*
UPDATE TLV1_Status 
SET 
  modo = 1,
  ocupacion = 0,
  averia = 0,
  matricula = 1001,
  pasillo_actual = 1,
  x_actual = 10,
  y_actual = 5,
  z_actual = 3,
  estadoFinOrden = 0,
  resultadoFinOrden = 0,
  timestamp = CURRENT_TIMESTAMP
WHERE 
  id = 1;
*/

-- Actualizar el registro de TLV2_Status
/*
UPDATE TLV2_Status 
SET 
  modo = 1,
  ocupacion = 0,
  averia = 0,
  matricula = 2001,
  pasillo_actual = 2,
  x_actual = 15,
  y_actual = 8,
  z_actual = 4,
  estadoFinOrden = 0,
  resultadoFinOrden = 0,
  timestamp = CURRENT_TIMESTAMP
WHERE 
  id = 1;
*/

-- Actualizar el registro de PT_Status
/*
UPDATE PT_Status 
SET 
  ocupacion = 0,
  estado = 0,
  situacion = 0,
  posicion = 5,
  timestamp = CURRENT_TIMESTAMP
WHERE 
  id = 1;
*/

-- CONSULTAS PARA REINICIAR LAS TABLAS (DESCOMENTAR PARA USAR)
-- Eliminar todos los registros excepto el id=1
/*
DELETE FROM TLV1_Status WHERE id != 1;
DELETE FROM TLV2_Status WHERE id != 1;
DELETE FROM PT_Status WHERE id != 1;
*/

-- CONSULTAS PARA INSERTAR REGISTROS INICIALES SI NO EXISTEN (DESCOMENTAR PARA USAR)
-- Insertar registro inicial en TLV1_Status si no existe
/*
INSERT INTO TLV1_Status (id, modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual, estadoFinOrden, resultadoFinOrden)
SELECT 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM TLV1_Status WHERE id = 1);
*/

-- Insertar registro inicial en TLV2_Status si no existe
/*
INSERT INTO TLV2_Status (id, modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual, estadoFinOrden, resultadoFinOrden)
SELECT 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM TLV2_Status WHERE id = 1);
*/

-- Insertar registro inicial en PT_Status si no existe
/*
INSERT INTO PT_Status (id, ocupacion, estado, situacion, posicion)
SELECT 1, 0, 0, 0, 0
FROM dual
WHERE NOT EXISTS (SELECT 1 FROM PT_Status WHERE id = 1);
*/
