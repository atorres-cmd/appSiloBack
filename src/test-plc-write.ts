// test-plc-write.ts
import dotenv from 'dotenv';
import { plcConfig, plcVariables } from './config/plcConfig';

// Cargar variables de entorno
dotenv.config();

// Importar nodes7 (sin tipos)
const nodes7 = require('nodes7');

console.log('=== Test de escritura en PLC Siemens S7-400 ===');
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

// Iniciar conexión
s7client.initiateConnection(connectionParams, (err: any) => {
  if (err) {
    console.error('❌ Error al conectar con el PLC:', err);
    process.exit(1);
  }

  console.log('✅ Conexión establecida con éxito');
  
  // Escribir valores de prueba en las marcas
  console.log('Escribiendo valores de prueba en las marcas...');
  
  // Valores a escribir
  const writeValues = {
    'MB0': 3,           // Modo: MANUAL (3)
  };
  
  // Escribir los valores uno por uno
  let writeCount = 0;
  const totalWrites = Object.keys(writeValues).length;
  
  for (const [address, value] of Object.entries(writeValues)) {
    s7client.writeItems(address, value, (err: any) => {
      if (err) {
        console.error(`❌ Error al escribir en ${address}:`, err);
      } else {
        console.log(`✅ Valor ${value} escrito correctamente en ${address}`);
      }
      
      writeCount++;
      
      // Si hemos completado todas las escrituras, leer los valores para verificar
      if (writeCount === totalWrites) {
        console.log('Leyendo valores para verificar...');
        
        // Leer los valores que acabamos de escribir
        s7client.addItems(Object.keys(writeValues));
        
        s7client.readAllItems((err: any, values: any) => {
          if (err) {
            console.error('❌ Error al leer variables:', err);
          } else {
            console.log('✅ Lectura exitosa:');
            console.log(JSON.stringify(values, null, 2));
          }
          
          // Cerrar conexión
          console.log('Prueba completada. Cerrando conexión...');
          s7client.dropConnection();
          process.exit(0);
        });
      }
    });
  }
});
