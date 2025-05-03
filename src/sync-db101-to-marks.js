// sync-db101-to-marks.js
// Script para sincronizar los valores del DB101 a las marcas (M)
require('dotenv').config();
const nodes7 = require('nodes7');

console.log('=== Sincronizador DB101 a Marcas para el Transelevador TLV1 ===');

// Crear instancia del cliente
const s7client = new nodes7();

// Configuración del PLC
const plcIP = process.env.PLC_IP || '10.21.178.100';
const plcRack = parseInt(process.env.PLC_RACK || '0');
const plcSlot = parseInt(process.env.PLC_SLOT || '3');

console.log(`Conectando al PLC en ${plcIP}, Rack=${plcRack}, Slot=${plcSlot}`);

// Parámetros de conexión
const connectionParams = {
  port: 102,
  host: plcIP,
  rack: plcRack,
  slot: plcSlot,
  timeout: 15000
};

// Mapeo de variables DB101 a marcas
const variableMapping = [
  // Estado del transelevador
  { db: 'DB101.DBB0', mark: 'MB0', type: 'byte' },       // Modo
  { db: 'DB101.DBB1', mark: 'M0.0', type: 'bit' },       // Ocupación (bit)
  { db: 'DB101.DBB2', mark: 'M0.1', type: 'bit' },       // Avería (bit)
  
  // Coordenadas actuales
  { db: 'DB101.DBW10', mark: 'MW10', type: 'word' },     // Coordenada X
  { db: 'DB101.DBW12', mark: 'MW12', type: 'word' },     // Coordenada Y
  { db: 'DB101.DBW14', mark: 'MW14', type: 'word' },     // Coordenada Z
  { db: 'DB101.DBW16', mark: 'MW16', type: 'word' },     // Matrícula
  { db: 'DB101.DBB18', mark: 'MB18', type: 'byte' },     // Pasillo
  
  // Datos de orden en curso
  { db: 'DB101.DBB20', mark: 'MB30', type: 'byte' },     // Tipo de orden
  { db: 'DB101.DBB22', mark: 'MB32', type: 'byte' },     // Pasillo origen
  { db: 'DB101.DBB23', mark: 'MW34', type: 'byte' },     // Coordenada X origen
  { db: 'DB101.DBB24', mark: 'MW36', type: 'byte' },     // Coordenada Y origen
  { db: 'DB101.DBB25', mark: 'MB38', type: 'byte' },     // Coordenada Z origen
  { db: 'DB101.DBB27', mark: 'MB40', type: 'byte' },     // Pasillo destino
  { db: 'DB101.DBB28', mark: 'MW42', type: 'byte' },     // Coordenada X destino
  { db: 'DB101.DBB29', mark: 'MW44', type: 'byte' },     // Coordenada Y destino
  { db: 'DB101.DBB30', mark: 'MB46', type: 'byte' },     // Coordenada Z destino
  { db: 'DB101.DBW32', mark: 'MW48', type: 'word' },     // Matrícula
  
  // Fin de orden
  { db: 'DB101.DBB40', mark: 'MB50', type: 'byte' },     // Estado
  { db: 'DB101.DBB41', mark: 'MB52', type: 'byte' },     // Resultado
  { db: 'DB101.DBB42', mark: 'MB54', type: 'byte' },     // Pasillo destino final
  { db: 'DB101.DBB43', mark: 'MW56', type: 'byte' },     // Coordenada X destino final
  { db: 'DB101.DBB44', mark: 'MW58', type: 'byte' },     // Coordenada Y destino final
  { db: 'DB101.DBB45', mark: 'MB60', type: 'byte' }      // Coordenada Z destino final
];

// Valores de prueba para inicializar las marcas (basados en la captura de pantalla)
const testValues = {
  'DB101.DBB0': 0,        // Modo: AUTOMÁTICO
  'DB101.DBB1': 1,        // Ocupación: OCUPADO
  'DB101.DBB2': 0,        // Avería: OK
  'DB101.DBW10': 5,       // Coordenada X: 5
  'DB101.DBW12': 0,       // Coordenada Y: 0
  'DB101.DBW14': 0,       // Coordenada Z: 0
  'DB101.DBW16': 0,       // Matrícula: 0
  'DB101.DBB18': 10,      // Pasillo: 10
  'DB101.DBB20': 0,       // Tipo de orden: SIN ORDEN
  'DB101.DBB22': 0,       // Pasillo origen: 0
  'DB101.DBB23': 0,       // Coordenada X origen: 0
  'DB101.DBB24': 0,       // Coordenada Y origen: 0
  'DB101.DBB25': 0,       // Coordenada Z origen: 0
  'DB101.DBB27': 0,       // Pasillo destino: 0
  'DB101.DBB28': 0,       // Coordenada X destino: 0
  'DB101.DBB29': 0,       // Coordenada Y destino: 0
  'DB101.DBB30': 0,       // Coordenada Z destino: 0
  'DB101.DBW32': 0,       // Matrícula: 0
  'DB101.DBB40': 0,       // Estado: SIN ORDEN
  'DB101.DBB41': 0,       // Resultado: OK DEP
  'DB101.DBB42': 0,       // Pasillo destino final: 0
  'DB101.DBB43': 0,       // Coordenada X destino final: 0
  'DB101.DBB44': 0,       // Coordenada Y destino final: 0
  'DB101.DBB45': 0        // Coordenada Z destino final: 0
};

// Conectar al PLC
s7client.initiateConnection(connectionParams, (err) => {
  if (err) {
    console.error('❌ Error al conectar con el PLC:', err);
    process.exit(1);
  }
  
  console.log('✅ Conexión establecida con éxito');
  
  // Sincronizar valores
  syncValues();
});

function syncValues() {
  console.log('\nIniciando sincronización de DB101 a marcas...');
  
  // Procesar cada variable en el mapeo
  let writePromises = [];
  
  for (const mapping of variableMapping) {
    const dbValue = testValues[mapping.db];
    
    if (dbValue !== undefined) {
      // Convertir el valor según el tipo para bits
      let markValue = dbValue;
      
      if (mapping.type === 'bit') {
        // Si es un bit, convertir a booleano (0 -> false, cualquier otro valor -> true)
        markValue = dbValue !== 0;
      }
      
      // Añadir a la lista de escrituras
      writePromises.push(
        new Promise((resolve, reject) => {
          s7client.writeItems(mapping.mark, markValue, (err) => {
            if (err) {
              console.error(`❌ Error al escribir ${mapping.mark}:`, err);
              reject(err);
            } else {
              console.log(`✅ ${mapping.db} (${dbValue}) -> ${mapping.mark} (${markValue})`);
              resolve();
            }
          });
        })
      );
    }
  }
  
  // Esperar a que todas las escrituras se completen
  Promise.allSettled(writePromises)
    .then(() => {
      console.log('\nSincronización completada');
      
      // Verificar los valores escritos
      verifyValues();
    })
    .catch((err) => {
      console.error('Error durante la sincronización:', err);
      s7client.dropConnection();
    });
}

function verifyValues() {
  console.log('\nVerificando valores escritos en las marcas...');
  
  // Crear un objeto con todas las marcas a leer
  const marksToRead = {};
  variableMapping.forEach(mapping => {
    marksToRead[mapping.mark] = mapping.mark;
  });
  
  // Añadir las marcas para lectura
  s7client.addItems(Object.values(marksToRead));
  
  // Leer todas las marcas
  s7client.readAllItems((err, values) => {
    if (err) {
      console.error('❌ Error al leer las marcas:', err);
    } else {
      console.log('✅ Valores actuales en las marcas:');
      console.log(JSON.stringify(values, null, 2));
    }
    
    // Desconectar
    s7client.dropConnection();
    console.log('\nDesconectado del PLC');
  });
}
