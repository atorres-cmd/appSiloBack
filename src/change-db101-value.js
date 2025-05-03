// change-db101-value.js
// Script para cambiar el valor de DB101.DBB40 a 2 (FIN DE ORDEN)
require('dotenv').config();
const nodes7 = require('nodes7');

console.log('=== Cambiando valor de DB101.DBB40 a 2 (FIN DE ORDEN) ===');

// Crear cliente S7
const s7client = new nodes7();

// Configuración del PLC
const plcIP = '10.21.178.100';
const plcRack = 0;
const plcSlot = 3;

console.log(`Conectando a PLC en ${plcIP} (Rack: ${plcRack}, Slot: ${plcSlot})...`);

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
  
  // Leer valor actual
  s7client.addItems('DB101,B40');
  s7client.readAllItems((err, values) => {
    if (err) {
      console.error('❌ Error al leer el valor actual:', err);
      closeConnection();
      return;
    }
    
    const currentValue = values['DB101,B40'];
    console.log(`Valor actual de DB101.DBB40: ${currentValue} (${getFinOrdenEstadoText(currentValue)})`);
    
    // Escribir nuevo valor (2 = FIN DE ORDEN)
    console.log('Cambiando valor a 2 (FIN DE ORDEN)...');
    s7client.writeItems('DB101,B40', 2, (err) => {
      if (err) {
        console.error('❌ Error al escribir el valor:', err);
        closeConnection();
        return;
      }
      
      console.log('✅ Valor cambiado con éxito');
      
      // Verificar el cambio
      s7client.readAllItems((err, values) => {
        if (err) {
          console.error('❌ Error al verificar el cambio:', err);
        } else {
          const newValue = values['DB101,B40'];
          console.log(`Nuevo valor de DB101.DBB40: ${newValue} (${getFinOrdenEstadoText(newValue)})`);
        }
        
        closeConnection();
      });
    });
  });
});

// Función para cerrar la conexión
function closeConnection() {
  console.log('Cerrando conexión...');
  s7client.dropConnection(() => {
    console.log('Conexión cerrada');
  });
}

// Función para obtener el texto del estado de fin de orden
function getFinOrdenEstadoText(estado) {
  switch (estado) {
    case 0: return 'SIN ORDEN';
    case 1: return 'EN CURSO';
    case 2: return 'FIN DE ORDEN';
    default: return 'DESCONOCIDO';
  }
}
