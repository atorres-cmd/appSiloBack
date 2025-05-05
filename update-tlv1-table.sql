-- Usar la base de datos
USE operator_insight;

-- Eliminar la tabla existente
DROP TABLE IF EXISTS TLV1_Status;

-- Crear la tabla TLV1_Status con campos enteros
CREATE TABLE TLV1_Status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  modo INT,
  ocupacion INT,
  averia INT,
  matricula INT,
  pasillo_actual INT,
  x_actual INT,
  y_actual INT,
  z_actual INT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar un registro de ejemplo
INSERT INTO TLV1_Status (modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual)
VALUES (1, 0, 0, 1001, 1, 10, 5, 3);
