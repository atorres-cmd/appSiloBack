-- Crear la base de datos si no existe
CREATE DATABASE IF NOT EXISTS operator_insight;

-- Usar la base de datos
USE operator_insight;

-- Crear usuario con privilegios
CREATE USER IF NOT EXISTS 'ai'@'localhost' IDENTIFIED BY '0260';
GRANT ALL PRIVILEGES ON operator_insight.* TO 'ai'@'localhost';
FLUSH PRIVILEGES;

-- Eliminar tabla anterior si existe
DROP TABLE IF EXISTS TLV1_Status;

-- Crear la tabla TLV1_Status
CREATE TABLE TLV1_Status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  modo VARCHAR(50),
  ocupacion BOOLEAN,
  averia BOOLEAN,
  matricula VARCHAR(50),
  pasillo_actual INT,
  x_actual FLOAT,
  y_actual FLOAT,
  z_actual FLOAT,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar un registro de ejemplo
INSERT INTO TLV1_Status (modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual)
VALUES ('Automático', FALSE, FALSE, 'TLV1-001', 1, 10.5, 5.2, 3.0);
