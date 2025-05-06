/**
 * Script para probar la sincronización del Puente Transferidor
 */
const mysql = require('mysql2/promise');

// Configuración de la conexión a MariaDB
const dbConfig = {
  host: 'localhost',
  user: 'ai',
  password: '0260',
  database: 'operator_insight'
};

// Simular datos del PLC
function simulatePTDataFromPLC() {
  // Generar datos aleatorios para simular el Puente Transferidor
  const ptData = {
    ocupacion: Math.random() > 0.5 ? 1 : 0,
    estado: Math.random() > 0.9 ? 1 : 0,
    situacion: Math.random() > 0.5 ? 1 : 0,
    posicion: Math.floor(Math.random() * 12) + 1
  };
  
  console.log('Datos simulados del PLC:', ptData);
  return ptData;
}

// Actualizar los datos en MariaDB
async function updatePTStatusInMariaDB(ptData) {
  let connection;
  try {
    connection = await mysql.createConnection(dbConfig);
    
    // Actualizar el registro más reciente
    const [result] = await connection.execute(`
      UPDATE PT_Status SET
        ocupacion = ?,
        estado = ?,
        situacion = ?,
        posicion = ?
      WHERE id = (SELECT max_id FROM (SELECT MAX(id) as max_id FROM PT_Status) as temp)
    `, [
      ptData.ocupacion,
      ptData.estado,
      ptData.situacion,
      ptData.posicion
    ]);
    
    console.log(`Datos actualizados en MariaDB. Filas afectadas: ${result.affectedRows}`);
    return result.affectedRows > 0;
  } catch (error) {
    console.error('Error al actualizar datos en MariaDB:', error);
    throw error;
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

// Función principal
async function main() {
  try {
    console.log('Probando sincronización del Puente Transferidor...');
    
    // Simular datos del PLC
    const ptData = simulatePTDataFromPLC();
    
    // Actualizar los datos en MariaDB
    const success = await updatePTStatusInMariaDB(ptData);
    
    console.log('Sincronización completada:', success ? 'OK' : 'Error');
    
    // Consultar los datos actualizados
    const connection = await mysql.createConnection(dbConfig);
    const [rows] = await connection.execute('SELECT * FROM PT_Status ORDER BY id DESC LIMIT 1');
    console.log('Datos actualizados en la tabla PT_Status:', rows[0]);
    await connection.end();
  } catch (error) {
    console.error('Error en la prueba de sincronización:', error);
  }
}

// Ejecutar la función principal
main();
