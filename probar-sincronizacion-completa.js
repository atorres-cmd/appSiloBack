// Script para probar la sincronización completa desde el PLC hasta la base de datos
const ptController = require('./src/controllers/ptMariaDBController');

async function probarSincronizacion() {
  try {
    console.log('Iniciando prueba de sincronización completa...');
    
    // 1. Leer datos del PLC
    console.log('\n=== PASO 1: Leer datos del PLC ===');
    const plcData = await ptController.readPLCData();
    
    if (!plcData) {
      console.error('No se pudieron leer datos del PLC. Abortando prueba.');
      return;
    }
    
    // 2. Convertir datos al formato de la base de datos
    console.log('\n=== PASO 2: Convertir datos al formato de la base de datos ===');
    const dbData = ptController.convertPLCDataToDBFormat(plcData);
    console.log('Datos convertidos:', dbData);
    
    // 3. Guardar datos en la base de datos
    console.log('\n=== PASO 3: Guardar datos en la base de datos ===');
    await ptController.saveToDatabase(dbData);
    
    console.log('\n=== PRUEBA COMPLETADA CON ÉXITO ===');
    console.log('Si no hubo errores, los datos deberían estar ahora en la tabla PT_Status.');
    console.log('Puedes verificarlo con la consulta: SELECT * FROM PT_Status ORDER BY timestamp DESC LIMIT 1;');
  } catch (error) {
    console.error('Error durante la prueba de sincronización:', error);
  }
}

// Ejecutar la prueba
probarSincronizacion();
