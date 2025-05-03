// test-db101-read.js
// Script para probar la lectura del DB101 usando la biblioteca nodes7
require('dotenv').config();
const nodes7 = require('nodes7');

console.log('=== Test de lectura del DB101 usando nodes7 ===');

// Crear cliente S7
const s7client = new nodes7();

// Configuración del PLC (basada en la configuración de Node-RED)
const plcIP = '10.21.178.100';
const plcRack = 0;
const plcSlot = 3;

console.log(`Conectando a PLC en ${plcIP} (Rack: ${plcRack}, Slot: ${plcSlot})...`);

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
  'orden_tipo': 'DB101,B20',
  'orden_pasillo_origen': 'DB101,B22',
  'orden_coord_x_origen': 'DB101,B23',
  'orden_coord_y_origen': 'DB101,B24',
  'orden_coord_z_origen': 'DB101,B25',
  'orden_pasillo_destino': 'DB101,B27',
  'orden_coord_x_destino': 'DB101,B28',
  'orden_coord_y_destino': 'DB101,B29',
  'orden_coord_z_destino': 'DB101,B30',
  'orden_matricula': 'DB101,W32',
  
  // Fin de orden
  'fin_orden_estado': 'DB101,B40',
  'fin_orden_resultado': 'DB101,B41',
  'fin_orden_pasillo_destino': 'DB101,B42',
  'fin_orden_coord_x_destino': 'DB101,B43',
  'fin_orden_coord_y_destino': 'DB101,B44',
  'fin_orden_coord_z_destino': 'DB101,B45'
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
      
      console.log('\n--- Estado del transelevador ---');
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
      console.log(`Pasillo origen: ${values.orden_pasillo_origen}`);
      console.log(`Coordenada X origen: ${values.orden_coord_x_origen}`);
      console.log(`Coordenada Y origen: ${values.orden_coord_y_origen}`);
      console.log(`Coordenada Z origen: ${values.orden_coord_z_origen}`);
      console.log(`Pasillo destino: ${values.orden_pasillo_destino}`);
      console.log(`Coordenada X destino: ${values.orden_coord_x_destino}`);
      console.log(`Coordenada Y destino: ${values.orden_coord_y_destino}`);
      console.log(`Coordenada Z destino: ${values.orden_coord_z_destino}`);
      console.log(`Matrícula orden: ${values.orden_matricula}`);
      
      console.log('\n--- Fin de orden ---');
      console.log(`Estado fin orden: ${values.fin_orden_estado} (${getFinOrdenEstadoText(values.fin_orden_estado)})`);
      console.log(`Resultado fin orden: ${values.fin_orden_resultado} (${getFinOrdenResultadoText(values.fin_orden_resultado)})`);
      console.log(`Pasillo destino final: ${values.fin_orden_pasillo_destino}`);
      console.log(`Coordenada X destino final: ${values.fin_orden_coord_x_destino}`);
      console.log(`Coordenada Y destino final: ${values.fin_orden_coord_y_destino}`);
      console.log(`Coordenada Z destino final: ${values.fin_orden_coord_z_destino}`);
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

function getFinOrdenEstadoText(estado) {
  switch (estado) {
    case 0: return 'SIN ORDEN';
    case 1: return 'EN CURSO';
    case 2: return 'FIN DE ORDEN';
    default: return 'DESCONOCIDO';
  }
}

function getFinOrdenResultadoText(resultado) {
  switch (resultado) {
    case 0: return 'OK DEPÓSITO';
    case 2: return 'OK EXTRACCIÓN';
    case 3: return 'ERROR DEPÓSITO';
    case 4: return 'ERROR EXTRACCIÓN';
    case 5: return 'OK TRASVASE';
    case 6: return 'ABORTADO';
    default: return 'DESCONOCIDO';
  }
}
