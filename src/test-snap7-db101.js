// test-snap7-db101.js
require('dotenv').config();
const snap7 = require('node-snap7');

// Crear cliente S7
const s7client = new snap7.S7Client();

// Obtener configuración del PLC desde variables de entorno
const plcIP = process.env.PLC_IP || '10.21.178.100';
const plcRack = parseInt(process.env.PLC_RACK || '0');
const plcSlot = parseInt(process.env.PLC_SLOT || '3');

console.log(`=== Test de conexión con PLC Siemens S7-400 usando snap7 ===`);
console.log(`Intentando conectar a: ${plcIP}`);
console.log(`Configuración: Rack=${plcRack}, Slot=${plcSlot}`);

// Conectar al PLC
const connectResult = s7client.ConnectTo(plcIP, plcRack, plcSlot);

if (connectResult === 0) {
  console.log('✅ Conexión establecida con éxito');
  
  try {
    // Leer el estado de la CPU
    const cpuInfo = s7client.GetCpuInfo();
    console.log('Información de la CPU:', cpuInfo);
    
    // Intentar leer algunos datos
    console.log('\nIntentando leer datos del PLC...');
    
    // Leer un byte de entrada (I)
    try {
      const inputByte = s7client.EBRead(0);
      console.log('Byte de entrada 0:', inputByte);
    } catch (err) {
      console.error('Error al leer byte de entrada:', err.message);
    }
    
    // Leer un byte de salida (Q)
    try {
      const outputByte = s7client.ABRead(0);
      console.log('Byte de salida 0:', outputByte);
    } catch (err) {
      console.error('Error al leer byte de salida:', err.message);
    }
    
    // Leer un byte de marca (M)
    try {
      const markerByte = s7client.MBRead(0);
      console.log('Byte de marca 0:', markerByte);
    } catch (err) {
      console.error('Error al leer byte de marca:', err.message);
    }
    
    // Intentar leer el DB101
    console.log('\nIntentando leer el DB101...');
    
    try {
      // Leer los primeros 50 bytes del DB101
      const db101Data = s7client.DBRead(101, 0, 50);
      console.log('Datos del DB101 (primeros 50 bytes):', db101Data);
      
      // Mostrar valores específicos
      console.log('DB101.DBB0 (Modo):', db101Data[0]);
      console.log('DB101.DBB1 (Ocupación):', db101Data[1]);
      console.log('DB101.DBB2 (Avería):', db101Data[2]);
      
      // Leer palabras (words - 2 bytes)
      const coordX = db101Data.readInt16BE(10); // DBW10
      const coordY = db101Data.readInt16BE(12); // DBW12
      const coordZ = db101Data.readInt16BE(14); // DBW14
      const matricula = db101Data.readInt16BE(16); // DBW16
      
      console.log('DB101.DBW10 (Coordenada X):', coordX);
      console.log('DB101.DBW12 (Coordenada Y):', coordY);
      console.log('DB101.DBW14 (Coordenada Z):', coordZ);
      console.log('DB101.DBW16 (Matrícula):', matricula);
      console.log('DB101.DBB18 (Pasillo):', db101Data[18]);
      console.log('DB101.DBB20 (Tipo de orden):', db101Data[20]);
    } catch (err) {
      console.error('Error al leer DB101:', err.message);
    }
    
  } catch (err) {
    console.error('Error durante la lectura de datos:', err.message);
  } finally {
    // Desconectar del PLC
    s7client.Disconnect();
    console.log('\nDesconectado del PLC');
  }
} else {
  console.error(`❌ Error al conectar con el PLC. Código: ${connectResult}`);
}
