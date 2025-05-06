-- Script para crear la tabla PT_Status
CREATE TABLE IF NOT EXISTS PT_Status (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ocupacion INT DEFAULT 0, -- DB110,DBB30: 0=LIBRE 1=OCUPADO
  estado INT DEFAULT 0,    -- DB110,DBB31: 0=OK 1=AVERIA
  situacion INT DEFAULT 0, -- DB110,DBB32: 0=PARADO 1=EN MOVIMIENTO
  posicion INT DEFAULT 1,  -- DB110,DBB33: Posición actual (1-12)
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Insertar un registro inicial si la tabla está vacía
INSERT INTO PT_Status (ocupacion, estado, situacion, posicion)
SELECT 0, 0, 0, 1
FROM DUAL
WHERE NOT EXISTS (SELECT 1 FROM PT_Status LIMIT 1);

-- Mostrar la estructura de la tabla
DESCRIBE PT_Status;

-- Mostrar los datos iniciales
SELECT * FROM PT_Status;
