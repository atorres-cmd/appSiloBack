// test-plc-connection.ts
import dotenv from 'dotenv';
import { plcConfig, plcVariables } from './config/plcConfig';

// Cargar variables de entorno
dotenv.config();

// Importar nodes7 (sin tipos)
const nodes7 = require('nodes7');

console.log('=== Test de conexión con PLC Siemens S7-400 ===');
console.log(`Intentando conectar a: ${plcConfig.ip}`);
console.log(`Configuración: Rack=${plcConfig.rack}, Slot=${plcConfig.slot}`);

// Crear instancia del cliente
const s7client = new nodes7();

// Parámetros de conexión para S7-400
const connectionParams = {
  port: 102,
  host: plcConfig.ip,
  rack: plcConfig.rack,
  slot: plcConfig.slot,
  timeout: 15000,
  debug: true
};

console.log('Usando configuración de conexión:', connectionParams);

// Crear un objeto con todas las variables para la prueba
const testVariables: { [key: string]: string } = {};

// Añadir todas las variables del transelevador TLV1
for (const [key, address] of Object.entries(plcVariables)) {
  testVariables[address] = address;
}

console.log('Variables a probar:', Object.keys(testVariables).length);

// Iniciar conexión
s7client.initiateConnection(connectionParams, (err: any) => {
  if (err) {
    console.error('❌ Error al conectar con el PLC:', err);
    process.exit(1);
  }

  console.log('✅ Conexión establecida con éxito');
  
  // Añadir variables para lectura
  console.log('Añadiendo variables para lectura...');
  s7client.addItems(Object.values(testVariables));
  
  // Leer variables
  console.log('Leyendo variables del PLC...');
  s7client.readAllItems((err: any, values: any) => {
    if (err) {
      console.error('❌ Error al leer variables:', err);
      s7client.dropConnection();
      process.exit(1);
    }
    
    console.log('✅ Lectura exitosa:');
    console.log(JSON.stringify(values, null, 2));
    
    // Intentar escribir un valor (opcional, solo si es seguro)
    console.log('Prueba completada. Cerrando conexión...');
    s7client.dropConnection();
    process.exit(0);
  });
});
