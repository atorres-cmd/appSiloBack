// Script para leer directamente los valores actuales del PLC S7-400
const nodes7 = require('nodes7');

// Configuración del PLC
const plcIP = '10.21.178.100';
const rack = 0;
const slot = 3;

// Variables a leer del DB101
const variablesToRead = [
  'DB101,B0', 'DB101,X0.0', 'DB101,X0.1',  // Estado
  'DB101,W10', 'DB101,W12', 'DB101,W14', 'DB101,W16', 'DB101,B18',  // Coordenadas
  'DB101,B20', 'DB101,B22', 'DB101,B23', 'DB101,B24', 'DB101,B25',  // Orden en curso (origen)
  'DB101,B27', 'DB101,B28', 'DB101,B29', 'DB101,B30', 'DB101,W32',  // Orden en curso (destino y matrícula)
  'DB101,B40', 'DB101,B41', 'DB101,B42', 'DB101,B43', 'DB101,B44', 'DB101,B45'  // Fin de orden
];

// Función para leer los valores del PLC
async function readPLCValues() {
  return new Promise((resolve, reject) => {
    console.log(`Intentando conectar al PLC S7-400 en ${plcIP}...`);
    
    const conn = new nodes7();
    
    // Configuración que funciona según las pruebas anteriores
    const connectionParams = {
      port: 102,
      host: plcIP,
      rack: rack,
      slot: slot,
      timeout: 15000,
      connectionType: 'ISO-on-TCP',
      doNotOptimize: true
    };
    
    // Intentar conectar con la configuración proporcionada
    conn.initiateConnection(connectionParams, (err) => {
      if (err) {
        console.error(`Error de conexión: ${err.message || err}`);
        reject(err);
        return;
      }
      
      console.log('Conexión establecida correctamente');
      
      // Añadir variables para lectura
      console.log('Registrando variables para lectura...');
      conn.addItems(variablesToRead);
      
      // Leer todas las variables
      conn.readAllItems((readErr, values) => {
        // Cerrar la conexión después de leer
        conn.dropConnection();
        
        if (readErr) {
          console.error(`Error al leer datos: ${readErr.message || readErr}`);
          reject(readErr);
          return;
        }
        
        console.log('Valores leídos correctamente:');
        
        // Procesar los valores leídos
        const processedValues = {
          modo: values['DB101,B0'] !== undefined ? values['DB101,B0'] : 0,
          ocupacion: values['DB101,X0.0'] === true,
          averia: values['DB101,X0.1'] === true,
          coord_x: values['DB101,W10'] !== undefined ? values['DB101,W10'] : 0,
          coord_y: values['DB101,W12'] !== undefined ? values['DB101,W12'] : 0,
          coord_z: values['DB101,W14'] !== undefined ? values['DB101,W14'] : 0,
          velocidad: values['DB101,W16'] !== undefined ? values['DB101,W16'] : 0,
          pasillo: values['DB101,B18'] !== undefined ? values['DB101,B18'] : 0,
          orden_tipo: values['DB101,B20'] !== undefined ? values['DB101,B20'] : 0,
          orden_pasillo_origen: values['DB101,B22'] !== undefined ? values['DB101,B22'] : 0,
          orden_coord_x_origen: values['DB101,B23'] !== undefined ? values['DB101,B23'] : 0,
          orden_coord_y_origen: values['DB101,B24'] !== undefined ? values['DB101,B24'] : 0,
          orden_coord_z_origen: values['DB101,B25'] !== undefined ? values['DB101,B25'] : 0,
          orden_pasillo_destino: values['DB101,B27'] !== undefined ? values['DB101,B27'] : 0,
          orden_coord_x_destino: values['DB101,B28'] !== undefined ? values['DB101,B28'] : 0,
          orden_coord_y_destino: values['DB101,B29'] !== undefined ? values['DB101,B29'] : 0,
          orden_coord_z_destino: values['DB101,B30'] !== undefined ? values['DB101,B30'] : 0,
          orden_matricula: values['DB101,W32'] !== undefined ? values['DB101,W32'] : 0,
          fin_orden_estado: values['DB101,B40'] !== undefined ? values['DB101,B40'] : 0,
          fin_orden_resultado: values['DB101,B41'] !== undefined ? values['DB101,B41'] : 0
        };
        
        // Mostrar los valores procesados
        console.log(JSON.stringify(processedValues, null, 2));
        
        // Mostrar los valores crudos para depuración
        console.log('\nValores crudos del PLC:');
        console.log(JSON.stringify(values, null, 2));
        
        resolve(processedValues);
      });
    });
    
    // Timeout para evitar que el script se quede colgado
    setTimeout(() => {
      conn.dropConnection();
      reject(new Error('Timeout de conexión'));
    }, 20000);
  });
}

// Ejecutar la función principal
readPLCValues()
  .then(() => {
    console.log('Lectura completada con éxito');
  })
  .catch(err => {
    console.error('Error:', err);
  });
