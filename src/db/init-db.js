const { query } = require('./mariadb-config');

// Función para inicializar la base de datos
async function initializeDatabase() {
  try {
    console.log('Conexión a MariaDB establecida correctamente');
    
    // Crear la base de datos si no existe
    await query('CREATE DATABASE IF NOT EXISTS operator_insight');
    console.log('Base de datos "operator_insight" creada o ya existente');
    
    // Usar la base de datos
    await query('USE operator_insight');
    console.log('Usando base de datos "operator_insight"');
    
    // Crear la tabla TLV1_Status
    await query(`
      CREATE TABLE IF NOT EXISTS TLV1_Status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        modo INT,
        ocupacion INT,
        averia INT,
        matricula INT,
        pasillo_actual INT,
        x_actual INT,
        y_actual INT,
        z_actual INT,
        estadoFinOrden INT,
        resultadoFinOrden INT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabla "TLV1_Status" creada o ya existente');
    
    // Crear la tabla TLV2_Status
    await query(`
      CREATE TABLE IF NOT EXISTS TLV2_Status (
        id INT AUTO_INCREMENT PRIMARY KEY,
        modo INT,
        ocupacion INT,
        averia INT,
        matricula INT,
        pasillo_actual INT,
        x_actual INT,
        y_actual INT,
        z_actual INT,
        estadoFinOrden INT,
        resultadoFinOrden INT,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('Tabla "TLV2_Status" creada o ya existente');
    
    // Insertar datos de ejemplo para TLV1_Status
    try {
      // Intentar insertar datos de ejemplo
      await query(`
        INSERT INTO TLV1_Status (modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual, estadoFinOrden, resultadoFinOrden)
        VALUES (1, 0, 0, 1001, 1, 10, 5, 3, 0, 0)
      `);
      console.log('Datos de ejemplo para TLV1_Status insertados correctamente');
    } catch (insertError) {
      // Si hay un error (probablemente porque ya existen datos), simplemente lo ignoramos
      console.log('Ya existen datos en la tabla TLV1_Status o hubo un error al insertar datos de ejemplo');
    }
    
    // Insertar datos de ejemplo para TLV2_Status
    try {
      // Intentar insertar datos de ejemplo
      await query(`
        INSERT INTO TLV2_Status (modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual, estadoFinOrden, resultadoFinOrden)
        VALUES (1, 0, 0, 2001, 4, 30, 8, 2, 0, 0)
      `);
      console.log('Datos de ejemplo para TLV2_Status insertados correctamente');
    } catch (insertError) {
      // Si hay un error (probablemente porque ya existen datos), simplemente lo ignoramos
      console.log('Ya existen datos en la tabla TLV2_Status o hubo un error al insertar datos de ejemplo');
    }
    
    console.log('Inicialización de la base de datos completada con éxito');
    return true;
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    return false;
  }
}

module.exports = {
  initializeDatabase
};
