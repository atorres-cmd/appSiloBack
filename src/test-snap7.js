// test-snap7.js
require('dotenv').config();
const snap7 = require('node-snap7');

// Crear cliente S7
const s7client = new snap7.S7Client();

// Configuración del PLC (basada en la configuración de Node-RED)
const plcIP = '10.21.178.100';
const plcRack = 0;
const plcSlot = 3;

console.log(`=== Test de conexión con PLC Siemens S7-400 usando snap7 ===`);
console.log(`Intentando conectar a: ${plcIP}`);
console.log(`Configuración: Rack=${plcRack}, Slot=${plcSlot}`);

// Conectar al PLC
console.log('Intentando conectar...');
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
      // Crear un buffer para almacenar los datos
      const bufferSize = 100; // Leer los primeros 100 bytes para cubrir todas las variables
      const buffer = Buffer.alloc(bufferSize);
      
      console.log(`Leyendo DB101 (tamaño: ${bufferSize} bytes)...`);
      
      // Intentar leer el DB101
      console.log('Ejecutando DBRead...');
      const result = s7client.DBRead(101, 0, bufferSize, buffer);
      
      if (result === 0) {
        console.log('\n✅ Lectura exitosa del DB101');
        console.log('Datos en hexadecimal (primeros 20 bytes):', buffer.slice(0, 20).toString('hex'));
        
        // Mostrar valores específicos
        console.log('\nEstado del transelevador:');
        const modo = buffer.readUInt8(0);
        const ocupacion = (buffer.readUInt8(0) & 0x01) > 0; // Bit 0.0
        const averia = (buffer.readUInt8(0) & 0x02) > 0;    // Bit 0.1
        
        console.log('DB101.DBB0 (Modo):', modo, getModeText(modo));
        console.log('DB101.DBX0.0 (Ocupación):', ocupacion ? 'OCUPADO' : 'LIBRE');
        console.log('DB101.DBX0.1 (Avería):', averia ? 'AVERÍA' : 'OK');
        
        // Leer coordenadas (words - 2 bytes)
        console.log('\nCoordenadas actuales:');
        const coordX = buffer.readUInt16BE(10); // DBW10
        const coordY = buffer.readUInt16BE(12); // DBW12
        const coordZ = buffer.readUInt16BE(14); // DBW14
        const matricula = buffer.readUInt16BE(16); // DBW16
        const pasillo = buffer.readUInt8(18);      // DBB18
        
        console.log('DB101.DBW10 (Coordenada X):', coordX);
        console.log('DB101.DBW12 (Coordenada Y):', coordY);
        console.log('DB101.DBW14 (Coordenada Z):', coordZ);
        console.log('DB101.DBW16 (Matrícula):', matricula);
        console.log('DB101.DBB18 (Pasillo):', pasillo);
        
        // Leer datos de orden
        console.log('\nDatos de orden en curso:');
        const ordenTipo = buffer.readUInt8(20);    // DBB20
        console.log('DB101.DBB20 (Tipo de orden):', ordenTipo, getOrderTypeText(ordenTipo));
        
        // Fin de orden
        console.log('\nFin de orden:');
        const finOrdenEstado = buffer.readUInt8(40);    // DBB40
        const finOrdenResultado = buffer.readUInt8(41); // DBB41
        console.log('DB101.DBB40 (Estado fin orden):', finOrdenEstado, getFinOrdenEstadoText(finOrdenEstado));
        console.log('DB101.DBB41 (Resultado fin orden):', finOrdenResultado, getFinOrdenResultadoText(finOrdenResultado));
      } else {
        console.error(`❌ Error al leer DB101. Código: ${result}`);
        console.error(`Descripción: ${s7client.ErrorText(result)}`);
      }
    } catch (err) {
      console.error('❌ Error al leer DB101:', err.message);
    }
    
    // Funciones auxiliares para mostrar textos descriptivos
    function getModeText(mode) {
      switch (mode) {
        case 0: return '(AUTOMÁTICO)';
        case 1: return '(SEMIAUTOMÁTICO)';
        case 2: return '(MANUAL)';
        default: return '(DESCONOCIDO)';
      }
    }
    
    function getOrderTypeText(type) {
      switch (type) {
        case 0: return '(SIN ORDEN)';
        case 1: return '(DEPÓSITO)';
        case 2: return '(EXTRACCIÓN)';
        case 3: return '(CAMBIO PASILLO)';
        case 4: return '(TRASVASE)';
        case 5: return '(TEST)';
        default: return '(DESCONOCIDO)';
      }
    }
    
    function getFinOrdenEstadoText(estado) {
      switch (estado) {
        case 0: return '(SIN ORDEN)';
        case 1: return '(EN CURSO)';
        case 2: return '(FIN DE ORDEN)';
        default: return '(DESCONOCIDO)';
      }
    }
    
    function getFinOrdenResultadoText(resultado) {
      switch (resultado) {
        case 0: return '(OK DEPÓSITO)';
        case 2: return '(OK EXTRACCIÓN)';
        case 3: return '(ERROR DEPÓSITO)';
        case 4: return '(ERROR EXTRACCIÓN)';
        case 5: return '(OK TRASVASE)';
        case 6: return '(ABORTADO)';
        default: return '(DESCONOCIDO)';
      }
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

// Desconectar
console.log('Desconectando...');
s7client.Disconnect();
console.log('Prueba completada.');
