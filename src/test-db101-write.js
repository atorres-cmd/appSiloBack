// test-db101-write.js
// Script para probar la escritura en el DB101 usando la biblioteca nodes7
require('dotenv').config();
const nodes7 = require('nodes7');

console.log('=== Test de escritura en el DB101 usando nodes7 ===');

// Crear cliente S7
const s7client = new nodes7();

// Configuración del PLC (basada en la configuración de Node-RED)
const plcIP = '10.21.178.100';
const plcRack = 0;
const plcSlot = 3;

console.log(`Conectando a PLC en ${plcIP} (Rack: ${plcRack}, Slot: ${plcSlot})...`);

// Variables a escribir en el DB101
const variablesToWrite = {
  // Cambiar el modo del transelevador (0=AUTOMÁTICO, 1=SEMIAUTOMÁTICO, 2=MANUAL)
  'modo': 'DB101,B0'
};

// Configurar conexión
s7client.initiateConnection({
  port: 102,
  host: plcIP,
  rack: plcRack,
  slot: plcSlot,
  debug: true
}, (err) => {
  if (err) {
    console.error('❌ Error al conectar:', err);
    return;
  }
  
  console.log('✅ Conexión establecida con éxito');
  
  // Agregar variables para lectura/escritura
  s7client.setTranslationCB((tag) => {
    return variablesToWrite[tag];
  });
  
  s7client.addItems(Object.keys(variablesToWrite));
  
  // Primero leer el valor actual
  console.log('Leyendo valor actual del modo...');
  s7client.readAllItems((err, values) => {
    if (err) {
      console.error('❌ Error al leer variables:', err);
      closeConnection();
      return;
    }
    
    console.log(`Valor actual del modo: ${values.modo} (${getModeText(values.modo)})`);
    
    // Calcular nuevo valor (alternar entre 0 y 1)
    const newMode = values.modo === 0 ? 1 : 0;
    console.log(`Cambiando modo a: ${newMode} (${getModeText(newMode)})`);
    
    // Escribir nuevo valor
    s7client.writeItems('modo', newMode, (err) => {
      if (err) {
        console.error('❌ Error al escribir el modo:', err);
        closeConnection();
        return;
      }
      
      console.log('✅ Modo cambiado con éxito');
      
      // Leer nuevamente para verificar el cambio
      console.log('Verificando el cambio...');
      setTimeout(() => {
        s7client.readAllItems((err, values) => {
          if (err) {
            console.error('❌ Error al leer variables después de la escritura:', err);
          } else {
            console.log(`Nuevo valor del modo: ${values.modo} (${getModeText(values.modo)})`);
          }
          
          closeConnection();
        });
      }, 1000); // Esperar 1 segundo para asegurarse de que el cambio se ha aplicado
    });
  });
});

// Función para cerrar la conexión
function closeConnection() {
  console.log('\nCerrando conexión...');
  s7client.dropConnection(() => {
    console.log('Conexión cerrada');
    console.log('Test completado');
  });
}

// Funciones auxiliares para mostrar textos descriptivos
function getModeText(mode) {
  switch (mode) {
    case 0: return 'AUTOMÁTICO';
    case 1: return 'SEMIAUTOMÁTICO';
    case 2: return 'MANUAL';
    default: return 'DESCONOCIDO';
  }
}
