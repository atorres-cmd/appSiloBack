// test-db101-combinations.js
// Script para probar diferentes combinaciones de rack y slot para acceder al DB101
require('dotenv').config();
const snap7 = require('node-snap7');

console.log('=== Test de conexión con PLC Siemens S7-400 para acceder al DB101 ===');

// Configuración del PLC
const plcIP = process.env.PLC_IP || '10.21.178.100';

// Combinaciones de rack y slot a probar
const combinations = [
  { rack: 0, slot: 0 },
  { rack: 0, slot: 1 },
  { rack: 0, slot: 2 },
  { rack: 0, slot: 3 },
  { rack: 1, slot: 0 },
  { rack: 1, slot: 1 },
  { rack: 1, slot: 2 },
  { rack: 1, slot: 3 },
];

// Función para probar una combinación
async function testCombination(rack, slot) {
  return new Promise((resolve) => {
    console.log(`\n----- Probando Rack=${rack}, Slot=${slot} -----`);
    
    // Crear cliente S7
    const s7client = new snap7.S7Client();
    
    // Configurar opciones de conexión
    s7client.SetConnectionType(1); // TCP
    
    // Intentar conectar
    console.log(`Conectando a ${plcIP}...`);
    const connectResult = s7client.ConnectTo(plcIP, rack, slot);
    
    if (connectResult === 0) {
      console.log('✅ Conexión establecida con éxito');
      
      try {
        // Intentar leer el DB101
        console.log('Intentando leer el DB101...');
        
        // Crear buffer para los datos
        const bufferSize = 50;
        const buffer = Buffer.alloc(bufferSize);
        
        // Leer el DB101
        const readResult = s7client.DBRead(101, 0, bufferSize, buffer);
        
        if (readResult === 0) {
          console.log('✅ Lectura exitosa del DB101');
          console.log('Primeros bytes (hex):', buffer.slice(0, 10).toString('hex'));
          console.log('DB101.DBB0 (Modo):', buffer.readUInt8(0));
          console.log('DB101.DBB1 (Ocupación):', buffer.readUInt8(1));
          console.log('DB101.DBB2 (Avería):', buffer.readUInt8(2));
          
          // Desconectar
          s7client.Disconnect();
          resolve({ success: true, rack, slot });
          return;
        } else {
          console.error(`❌ Error al leer DB101. Código: ${readResult}`);
          console.error(`Descripción: ${s7client.ErrorText(readResult)}`);
        }
      } catch (err) {
        console.error('❌ Error durante la lectura:', err.message);
      }
      
      // Desconectar si hubo conexión pero falló la lectura
      s7client.Disconnect();
    } else {
      console.error(`❌ Error al conectar. Código: ${connectResult}`);
    }
    
    resolve({ success: false, rack, slot });
  });
}

// Probar todas las combinaciones
async function testAllCombinations() {
  const results = [];
  
  for (const combo of combinations) {
    const result = await testCombination(combo.rack, combo.slot);
    results.push(result);
    
    // Si encontramos una combinación exitosa, podemos parar
    if (result.success) {
      console.log(`\n✅ Combinación exitosa encontrada: Rack=${result.rack}, Slot=${result.slot}`);
      break;
    }
    
    // Pequeña pausa entre intentos
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
  
  // Mostrar resumen
  console.log('\n----- Resumen de pruebas -----');
  const successfulCombos = results.filter(r => r.success);
  
  if (successfulCombos.length > 0) {
    console.log('Combinaciones exitosas:');
    successfulCombos.forEach(r => {
      console.log(`- Rack=${r.rack}, Slot=${r.slot}`);
    });
  } else {
    console.log('❌ No se encontró ninguna combinación exitosa para acceder al DB101');
    console.log('Sugerencias:');
    console.log('1. Verificar que el PLC esté encendido y accesible en la red');
    console.log('2. Comprobar la configuración de seguridad del PLC');
    console.log('3. Verificar que el DB101 existe y está accesible');
    console.log('4. Probar con diferentes librerías o herramientas');
  }
}

// Ejecutar las pruebas
testAllCombinations().catch(err => {
  console.error('Error durante las pruebas:', err);
});
