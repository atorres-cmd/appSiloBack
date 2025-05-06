/**
 * Script para probar la sincronización del Puente Transferidor
 */
const puenteController = require('./src/controllers/puenteController');

async function main() {
  try {
    console.log('===================================================');
    console.log('   Prueba de sincronización del Puente Transferidor');
    console.log('===================================================');
    console.log();
    
    // Inicializar la tabla PT_Status
    await puenteController.initPTStatusTable();
    console.log('Tabla PT_Status inicializada correctamente');
    console.log();
    
    // Sincronizar datos desde el PLC (simulados)
    console.log('Sincronizando datos desde el PLC...');
    const result = await puenteController.syncPTDataFromPLCToMariaDB(true);
    console.log('Resultado de la sincronización:', result.success ? 'OK' : 'Error');
    console.log('Datos sincronizados:', result.data);
    console.log();
    
    // Obtener datos actuales
    console.log('Obteniendo datos actuales desde MariaDB...');
    const ptStatus = await puenteController.getPTStatusFromMariaDB();
    console.log('Datos actuales en MariaDB:', ptStatus);
    console.log();
    
    console.log('Prueba completada correctamente');
  } catch (error) {
    console.error('Error en la prueba de sincronización:', error);
  }
}

// Ejecutar la prueba
main();
