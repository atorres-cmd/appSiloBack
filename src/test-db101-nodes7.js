// test-db101-nodes7.js
// Script para probar la lectura del DB101 usando la biblioteca nodes7
require('dotenv').config();
const nodes7 = require('nodes7');

console.log('=== Test de conexión con PLC Siemens S7-400 usando nodes7 ===');

// Crear cliente S7
const s7client = new nodes7();

// Configuración del PLC
const plcIP = process.env.PLC_IP || '10.21.178.100';
const plcRack = parseInt(process.env.PLC_RACK || '0');
const plcSlot = parseInt(process.env.PLC_SLOT || '3');

// Variables a leer del DB101
const variables = {
  // Estado del transelevador
  'modo': 'DB101,B0',
  'ocupacion': 'DB101,X0.0',
  'averia': 'DB101,X0.1',
  
  // Coordenadas actuales
  'coord_x': 'DB101,W10',
  'coord_y': 'DB101,W12',
  'coord_z': 'DB101,W14',
  'matricula': 'DB101,W16',
  'pasillo': 'DB101,B18',
  
  // Datos de orden en curso
  'orden_tipo': 'DB101,B20'
};

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
  console.log('Agregando variables para lectura...');
  
  // Agregar variables para lectura
  s7client.setTranslationCB((tag) => {
    return variables[tag];
  });
  
  s7client.addItems(Object.keys(variables));
  
  // Leer variables
  console.log('Leyendo variables del DB101...');
  s7client.readAllItems((err, values) => {
    if (err) {
      console.error('❌ Error al leer variables:', err);
    } else {
      console.log('\n=== Valores leídos del DB101 ===');
      console.log('--- Estado del transelevador ---');
      console.log(`Modo: ${values.modo} (${getModeText(values.modo)})`);
      console.log(`Ocupación: ${values.ocupacion ? 'OCUPADO' : 'LIBRE'}`);
      console.log(`Avería: ${values.averia ? 'AVERÍA' : 'OK'}`);
      
      console.log('\n--- Coordenadas actuales ---');
      console.log(`Coordenada X: ${values.coord_x}`);
      console.log(`Coordenada Y: ${values.coord_y}`);
      console.log(`Coordenada Z: ${values.coord_z}`);
      console.log(`Matrícula: ${values.matricula}`);
      console.log(`Pasillo: ${values.pasillo}`);
      
      console.log('\n--- Datos de orden en curso ---');
      console.log(`Tipo de orden: ${values.orden_tipo} (${getOrderTypeText(values.orden_tipo)})`);
    }
    
    // Cerrar conexión
    console.log('\nCerrando conexión...');
    s7client.dropConnection(() => {
      console.log('Conexión cerrada');
      console.log('Test completado');
    });
  });
});

// Funciones auxiliares para mostrar textos descriptivos
function getModeText(mode) {
  switch (mode) {
    case 0: return 'AUTOMÁTICO';
    case 1: return 'SEMIAUTOMÁTICO';
    case 2: return 'MANUAL';
    default: return 'DESCONOCIDO';
  }
}

function getOrderTypeText(type) {
  switch (type) {
    case 0: return 'SIN ORDEN';
    case 1: return 'DEPÓSITO';
    case 2: return 'EXTRACCIÓN';
    case 3: return 'CAMBIO PASILLO';
    case 4: return 'TRASVASE';
    case 5: return 'TEST';
    default: return 'DESCONOCIDO';
  }
}
