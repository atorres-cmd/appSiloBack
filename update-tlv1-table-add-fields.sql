-- Usar la base de datos
USE operator_insight;

-- Añadir los nuevos campos a la tabla TLV1_Status
ALTER TABLE TLV1_Status 
ADD COLUMN estadoFinOrden INT DEFAULT 0,
ADD COLUMN resultadoFinOrden INT DEFAULT 0;

-- Mostrar la estructura actualizada de la tabla
DESCRIBE TLV1_Status;
