// Script para probar diferentes configuraciones de conexión con el PLC S7-400
const nodes7 = require('nodes7');

// Configuración del PLC
const plcIP = '10.21.178.100';
const defaultRack = 0;
const defaultSlot = 3;

// Función para probar una configuración específica
async function testConnection(config) {
  return new Promise((resolve) => {
    console.log(`\n\nProbando configuración: ${JSON.stringify(config, null, 2)}`);
    
    const conn = new nodes7();
    
    // Intentar conectar con la configuración proporcionada
    conn.initiateConnection(config, (err) => {
      if (err) {
        console.log(`❌ Error de conexión: ${err.message || err}`);
        resolve(false);
        return;
      }
      
      console.log('✅ Conexión establecida correctamente');
      
      // Intentar leer una variable para verificar que la conexión funciona
      conn.addItems('DB101,B0');
      
      conn.readAllItems((readErr, values) => {
        if (readErr) {
          console.log(`❌ Error al leer datos: ${readErr.message || readErr}`);
          resolve(false);
        } else {
          console.log(`✅ Lectura exitosa: ${JSON.stringify(values)}`);
          resolve(true);
        }
        
        // Cerrar la conexión
        conn.dropConnection();
      });
    });
    
    // Timeout para evitar que el script se quede colgado
    setTimeout(() => {
      console.log('⚠️ Timeout de conexión');
      conn.dropConnection();
      resolve(false);
    }, 10000);
  });
}

// Configuraciones a probar
const configurations = [
  // Configuración 1: Estándar para S7-300/400
  {
    port: 102,
    host: plcIP,
    rack: defaultRack,
    slot: defaultSlot,
    timeout: 15000,
    localTSAP: '0100',
    remoteTSAP: '0200',
    connectionType: 'PG'
  },
  
  // Configuración 2: Usando TSAP explícito
  {
    port: 102,
    host: plcIP,
    rack: defaultRack,
    slot: defaultSlot,
    timeout: 15000,
    localTSAP: '0100',
    remoteTSAP: '0300',
    connectionType: 'TSAP'
  },
  
  // Configuración 3: Usando valores TSAP basados en rack/slot (formato corregido)
  {
    port: 102,
    host: plcIP,
    rack: defaultRack,
    slot: defaultSlot,
    timeout: 15000,
    localTSAP: '0100',
    remoteTSAP: '0103', // 01 + rack(0) + slot(3)
    connectionType: 'TSAP'
  },
  
  // Configuración 4: Conexión OP
  {
    port: 102,
    host: plcIP,
    rack: defaultRack,
    slot: defaultSlot,
    timeout: 15000,
    localTSAP: '0200',
    remoteTSAP: '0200',
    connectionType: 'OP'
  },
  
  // Configuración 5: Sin TSAP explícito
  {
    port: 102,
    host: plcIP,
    rack: defaultRack,
    slot: defaultSlot,
    timeout: 15000
  },
  
  // Configuración 6: Probar con rack=1, slot=1 (valores comunes)
  {
    port: 102,
    host: plcIP,
    rack: 1,
    slot: 1,
    timeout: 15000
  },
  
  // Configuración 7: Probar con rack=0, slot=2 (otro valor común)
  {
    port: 102,
    host: plcIP,
    rack: 0,
    slot: 2,
    timeout: 15000
  },
  
  // Configuración 8: Conexión S7 Basic
  {
    port: 102,
    host: plcIP,
    rack: defaultRack,
    slot: defaultSlot,
    timeout: 15000,
    localTSAP: '0300',
    remoteTSAP: '0300',
    connectionType: 'BASIC'
  },
  
  // Configuración 9: Conexión ISO-on-TCP estándar para S7-400
  {
    port: 102,
    host: plcIP,
    rack: defaultRack,
    slot: defaultSlot,
    timeout: 15000,
    connectionType: 'ISO-on-TCP',
    doNotOptimize: true
  },
  
  // Configuración 10: Valores TSAP específicos para S7-400
  {
    port: 102,
    host: plcIP,
    rack: defaultRack,
    slot: defaultSlot,
    timeout: 15000,
    localTSAP: '4D57', // Valores TSAP específicos para S7-400
    remoteTSAP: '4D57',
    connectionType: 'TSAP'
  }
];

// Ejecutar las pruebas
async function runTests() {
  console.log('Iniciando pruebas de conexión con el PLC S7-400...');
  console.log(`IP del PLC: ${plcIP}`);
  console.log(`Rack predeterminado: ${defaultRack}`);
  console.log(`Slot predeterminado: ${defaultSlot}`);
  
  let successfulConfigs = [];
  
  for (let i = 0; i < configurations.length; i++) {
    const config = configurations[i];
    console.log(`\n==== Prueba ${i + 1}/${configurations.length} ====`);
    
    const success = await testConnection(config);
    
    if (success) {
      successfulConfigs.push({
        index: i + 1,
        config: config
      });
    }
    
    // Esperar un momento entre pruebas
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  // Mostrar resultados
  console.log('\n\n==== RESULTADOS ====');
  
  if (successfulConfigs.length === 0) {
    console.log('❌ Ninguna configuración funcionó correctamente.');
    console.log('Posibles causas:');
    console.log('1. El PLC no está configurado para aceptar conexiones remotas');
    console.log('2. Hay un firewall bloqueando la conexión');
    console.log('3. El PLC tiene una configuración de seguridad que impide la conexión');
    console.log('4. Los valores de rack/slot son incorrectos');
  } else {
    console.log(`✅ ${successfulConfigs.length} configuración(es) funcionaron correctamente:`);
    successfulConfigs.forEach(({ index, config }) => {
      console.log(`\nConfiguración #${index}:`);
      console.log(JSON.stringify(config, null, 2));
    });
  }
}

// Ejecutar el script
runTests().catch(err => {
  console.error('Error al ejecutar las pruebas:', err);
});
