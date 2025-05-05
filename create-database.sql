-- Crear la base de datos
CREATE DATABASE IF NOT EXISTS operator_insight;

-- Usar la base de datos
USE operator_insight;

-- Crear la tabla de componentes
CREATE TABLE IF NOT EXISTS components (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  type ENUM('transelevador', 'transferidor', 'puente', 'elevador') NOT NULL,
  status ENUM('active', 'inactive', 'error', 'maintenance') NOT NULL DEFAULT 'inactive',
  position_x FLOAT,
  position_y FLOAT,
  position_z FLOAT,
  last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Crear la tabla de alarmas
CREATE TABLE IF NOT EXISTS alarms (
  id VARCHAR(36) PRIMARY KEY,
  component_id VARCHAR(36) NOT NULL,
  type ENUM('error', 'warning', 'info', 'success') NOT NULL,
  message TEXT NOT NULL,
  active BOOLEAN NOT NULL DEFAULT TRUE,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  resolved_at TIMESTAMP NULL,
  FOREIGN KEY (component_id) REFERENCES components(id)
);

-- Insertar datos de ejemplo para los componentes
INSERT INTO components (id, name, type, status, position_x, position_y, position_z)
VALUES
  ('t1', 'Transelevador 1', 'transelevador', 'active', 1, 2, 0),
  ('t2', 'Transelevador 2', 'transelevador', 'active', 5, 3, 0),
  ('ct', 'Carro Transferidor', 'transferidor', 'active', 3, 0, 0),
  ('p1', 'Puente', 'puente', 'active', 0, 2, 0),
  ('el1', 'Elevador', 'elevador', 'active', 12, 0, 0);

-- Insertar algunas alarmas de ejemplo
INSERT INTO alarms (id, component_id, type, message, active)
VALUES
  ('a1', 't1', 'warning', 'Batería baja en el transelevador 1', TRUE),
  ('a2', 't2', 'error', 'Error de comunicación en el transelevador 2', TRUE),
  ('a3', 'ct', 'info', 'Mantenimiento programado para el carro transferidor', FALSE);
