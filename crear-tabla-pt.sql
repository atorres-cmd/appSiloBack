-- Script para crear la tabla PT_Status
CREATE TABLE IF NOT EXISTS PT_Status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  modo INT DEFAULT 1,
  ocupacion INT DEFAULT 0,
  averia INT DEFAULT 0,
  matricula INT DEFAULT 0,
  pasillo_actual INT DEFAULT 6,
  x_actual INT DEFAULT 0,
  y_actual INT DEFAULT 0,
  z_actual INT DEFAULT 0,
  estadoFinOrden INT DEFAULT 0,
  resultadoFinOrden INT DEFAULT 0,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar un registro inicial si la tabla está vacía
INSERT INTO PT_Status (modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual, estadoFinOrden, resultadoFinOrden)
SELECT 1, 0, 0, 0, 6, 0, 0, 0, 0, 0
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM PT_Status LIMIT 1);

-- Mostrar la estructura de la tabla
DESCRIBE PT_Status;

-- Mostrar los datos iniciales
SELECT * FROM PT_Status;
