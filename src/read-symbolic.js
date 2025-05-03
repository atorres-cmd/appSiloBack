// Script para leer variables del PLC usando nombres simbólicos
const nodes7 = require('nodes7');
const conn = new nodes7();

// Tabla de símbolos simplificada
const symbolTable = {
  'TLV1.MODO': 'DB101,B0',
  'TLV1.OCUPACION': 'DB101,X0.0',
  'TLV1.AVERIA': 'DB101,X0.1',
  'TLV1.COORD_X': 'DB101,W10',
  'TLV1.COORD_Y': 'DB101,W12',
  'TLV1.COORD_Z': 'DB101,W14',
  'TLV1.FIN_ORDEN.ESTADO': 'DB101,B40'
};

// Función para convertir nombres simbólicos a direcciones absolutas
function getAddressFromSymbol(symbolName) {
  return symbolTable[symbolName] || null;
}

// Configuración de conexión al PLC
const connectionParams = {
  host: '10.21.178.100', // IP del PLC
  port: 102,             // Puerto estándar para S7 TCP/IP
  rack: 0,               // Rack del PLC
  slot: 3,               // Slot del PLC
  timeout: 10000         // Timeout en ms
};

// Variables a leer usando nombres simbólicos
const symbolicVariables = [
  'TLV1.MODO',
  'TLV1.OCUPACION',
  'TLV1.AVERIA',
  'TLV1.COORD_X',
  'TLV1.COORD_Y',
  'TLV1.COORD_Z',
  'TLV1.FIN_ORDEN.ESTADO'
];

// Convertir nombres simbólicos a direcciones absolutas
const addressesToRead = symbolicVariables.map(symbolName => {
  const address = getAddressFromSymbol(symbolName);
  if (!address) {
    console.error(`Error: No se encontró dirección para el símbolo ${symbolName}`);
  }
  return address;
}).filter(Boolean); // Eliminar valores nulos

// Conectar al PLC
console.log(`Intentando conectar al PLC en ${connectionParams.host}:${connectionParams.port}...`);
conn.initiateConnection(connectionParams, (err) => {
  if (err) {
    console.error('Error al conectar con el PLC:', err);
    process.exit(1);
  }
  
  console.log('Conexión establecida con el PLC');
  
  // Añadir variables para leer
  conn.addItems(addressesToRead);
  
  // Leer los valores
  conn.readAllItems((err, values) => {
    if (err) {
      console.error('Error al leer valores:', err);
      process.exit(1);
    }
    
    console.log('Valores leídos del PLC:');
    console.log('----------------------');
    
    // Mostrar los valores con sus nombres simbólicos
    symbolicVariables.forEach(symbolName => {
      const address = getAddressFromSymbol(symbolName);
      if (address && values[address] !== undefined) {
        console.log(`${symbolName}: ${values[address]}`);
      }
    });
    
    // Interpretar algunos valores específicos
    const modoTexto = (() => {
      switch (values[getAddressFromSymbol('TLV1.MODO')]) {
        case 0: return 'AUTOMÁTICO';
        case 1: return 'SEMIAUTOMÁTICO';
        case 2: return 'MANUAL';
        default: return 'DESCONOCIDO';
      }
    })();
    
    const estadoFinOrdenTexto = (() => {
      switch (values[getAddressFromSymbol('TLV1.FIN_ORDEN.ESTADO')]) {
        case 0: return 'SIN ORDEN';
        case 1: return 'EN CURSO';
        case 2: return 'FIN DE ORDEN';
        case 4: return 'ESTADO ESPECIAL (4)';
        default: return 'DESCONOCIDO';
      }
    })();
    
    console.log('\nInterpretación:');
    console.log('----------------------');
    console.log(`Modo: ${modoTexto}`);
    console.log(`Estado Fin Orden: ${estadoFinOrdenTexto}`);
    console.log(`Ocupación: ${values[getAddressFromSymbol('TLV1.OCUPACION')] ? 'OCUPADO' : 'LIBRE'}`);
    console.log(`Avería: ${values[getAddressFromSymbol('TLV1.AVERIA')] ? 'CON AVERÍA' : 'OK'}`);
    console.log(`Posición: X=${values[getAddressFromSymbol('TLV1.COORD_X')]}, Y=${values[getAddressFromSymbol('TLV1.COORD_Y')]}, Z=${values[getAddressFromSymbol('TLV1.COORD_Z')]}`);
    
    // Desconectar del PLC
    conn.dropConnection(() => {
      console.log('\nDesconectado del PLC');
      process.exit(0);
    });
  });
});
