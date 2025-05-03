// Script para leer específicamente el valor de DB101,B40 del PLC Siemens S7-400
const nodes7 = require('nodes7');
const conn = new nodes7();

// Configuración de conexión al PLC
const connectionParams = {
  host: '10.21.178.100', // IP del PLC
  port: 102,             // Puerto estándar para S7 TCP/IP
  rack: 0,               // Rack del PLC
  slot: 3,               // Slot del PLC
  timeout: 10000         // Timeout en ms
};

// Variable a leer
const variables = {
  'estado_fin_orden': 'DB101,B40'
};

// Conectar al PLC
console.log(`Intentando conectar al PLC en ${connectionParams.host}:${connectionParams.port}...`);
conn.initiateConnection(connectionParams, (err) => {
  if (err) {
    console.error('Error al conectar con el PLC:', err);
    process.exit(1);
  }
  
  console.log('Conexión establecida con el PLC');
  
  // Añadir variables para leer
  conn.addItems(['DB101,B40']);
  
  // Leer el valor de DB101,B40
  conn.readAllItems((err, values) => {
    if (err) {
      console.error('Error al leer DB101,B40:', err);
      process.exit(1);
    }
    
    console.log('Valor de DB101,B40 (Estado Fin Orden):', values['DB101,B40']);
    
    // Interpretar el valor
    let estadoTexto = 'DESCONOCIDO';
    switch (values['DB101,B40']) {
      case 0:
        estadoTexto = 'SIN ORDEN';
        break;
      case 1:
        estadoTexto = 'EN CURSO';
        break;
      case 2:
        estadoTexto = 'FIN DE ORDEN';
        break;
    }
    
    console.log(`Interpretación: ${estadoTexto}`);
    
    // Desconectar del PLC
    conn.dropConnection(() => {
      console.log('Desconectado del PLC');
      process.exit(0);
    });
  });
});
