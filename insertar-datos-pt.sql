-- Insertar datos de prueba en la tabla PT_Status
INSERT INTO PT_Status (ocupacion, estado, situacion, posicion)
VALUES (1, 0, 1, 3);

-- Mostrar los datos actuales
SELECT * FROM PT_Status ORDER BY id DESC LIMIT 5;
