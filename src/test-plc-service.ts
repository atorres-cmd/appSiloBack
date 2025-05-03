// test-plc-service.ts
// Script para probar el servicio PLCService con la configuración del DB101
import dotenv from 'dotenv';
import PLCService from './services/plcService';
import { plcConfig, plcVariables } from './config/plcConfig';

// Cargar variables de entorno
dotenv.config();

console.log('=== Test del servicio PLCService con DB101 ===');

// Crear instancia del servicio PLC
const plcService = new PLCService(plcConfig, plcVariables);

// Escuchar eventos de actualización de componentes
plcService.on('componentsUpdate', (components) => {
  console.log('\n=== Actualización de componentes ===');
  console.log(JSON.stringify(components, null, 2));
});

// Conectar con el PLC
console.log('Conectando con el PLC...');
plcService.connect()
  .then((connected) => {
    if (connected) {
      console.log('✅ Conexión establecida con éxito');
      
      // Esperar 5 segundos para recibir algunas actualizaciones
      console.log('Esperando actualizaciones...');
      setTimeout(() => {
        // Probar cambio de modo
        console.log('\n=== Probando cambio de modo ===');
        console.log('Cambiando modo a SEMIAUTOMÁTICO (1)...');
        
        plcService.setTLV1Mode(1)
          .then((success) => {
            if (success) {
              console.log('✅ Modo cambiado con éxito');
              
              // Esperar 2 segundos y volver a modo AUTOMÁTICO
              setTimeout(() => {
                console.log('Cambiando modo a AUTOMÁTICO (0)...');
                
                plcService.setTLV1Mode(0)
                  .then((success) => {
                    if (success) {
                      console.log('✅ Modo cambiado con éxito');
                      
                      // Esperar 2 segundos más para ver actualizaciones
                      setTimeout(() => {
                        // Desconectar
                        console.log('\nDesconectando del PLC...');
                        plcService.disconnect();
                        console.log('Test completado');
                        process.exit(0);
                      }, 2000);
                    } else {
                      console.error('❌ Error al cambiar el modo');
                      finalizarTest();
                    }
                  })
                  .catch((err) => {
                    console.error('❌ Error al cambiar el modo:', err);
                    finalizarTest();
                  });
              }, 2000);
            } else {
              console.error('❌ Error al cambiar el modo');
              finalizarTest();
            }
          })
          .catch((err) => {
            console.error('❌ Error al cambiar el modo:', err);
            finalizarTest();
          });
      }, 5000);
    } else {
      console.error('❌ Error al conectar con el PLC');
      finalizarTest();
    }
  })
  .catch((err) => {
    console.error('❌ Error al conectar con el PLC:', err);
    finalizarTest();
  });

// Función para finalizar el test
function finalizarTest() {
  plcService.disconnect();
  console.log('Test finalizado con errores');
  process.exit(1);
}
