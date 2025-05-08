// Script para probar la lectura directa del PLC
const ptController = require('./src/controllers/ptMariaDBController');

console.log('Iniciando prueba de lectura directa del PLC (DB110 - Puente Transferidor)...');

// Llamar directamente al método que lee del PLC
ptController.readPLCData()
  .then(data => {
    console.log('Lectura completada. Los valores crudos se muestran arriba.');
    
    if (data) {
      // Mostrar los datos convertidos
      const formattedData = ptController.convertPLCDataToDBFormat(data);
      console.log('\nDatos convertidos al formato de la base de datos:');
      console.log(formattedData);
    }
  })
  .catch(error => {
    console.error('Error durante la prueba:', error);
  });
