// Script para forzar la inserción de un nuevo registro en la base de datos con los valores actuales del PLC
const nodes7 = require('nodes7');
const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

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

// Ruta a la base de datos
const dbPath = path.join(process.cwd(), 'tlv_data.sqlite');

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
          ocupacion: values['DB101,X0.0'] === true ? 1 : 0,
          averia: values['DB101,X0.1'] === true ? 1 : 0,
          coord_x: values['DB101,W10'] !== undefined ? values['DB101,W10'] : 0,
          coord_y: values['DB101,W12'] !== undefined ? values['DB101,W12'] : 0,
          coord_z: values['DB101,W14'] !== undefined ? values['DB101,W14'] : 0,
          matricula: values['DB101,W32'] !== undefined ? values['DB101,W32'] : 0,
          pasillo: values['DB101,B18'] !== undefined ? values['DB101,B18'] : 0,
          tipo_orden: values['DB101,B20'] !== undefined ? values['DB101,B20'] : 0,
          fin_orden_estado: values['DB101,B40'] !== undefined ? values['DB101,B40'] : 0,
          fin_orden_resultado: values['DB101,B41'] !== undefined ? values['DB101,B41'] : 0
        };
        
        // Mostrar los valores procesados
        console.log(JSON.stringify(processedValues, null, 2));
        
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

// Función para insertar los valores en la base de datos
async function insertIntoDatabase(values) {
  return new Promise((resolve, reject) => {
    console.log(`Verificando si la base de datos existe en: ${dbPath}`);
    
    if (!fs.existsSync(dbPath)) {
      reject(new Error(`La base de datos no existe en: ${dbPath}`));
      return;
    }
    
    console.log('Base de datos encontrada, conectando...');
    
    const db = new sqlite3.Database(dbPath, (err) => {
      if (err) {
        reject(new Error(`Error al conectar a la base de datos: ${err.message}`));
        return;
      }
      
      console.log('Conexión a la base de datos establecida');
      
      // Insertar valores en la tabla tlv1_record
      const sql = `INSERT INTO tlv1_record (
        timestamp, modo, ocupacion, averia, coord_x, coord_y, coord_z, 
        matricula, pasillo, tipo_orden, fin_orden_estado, fin_orden_resultado
      ) VALUES (
        datetime('now'), ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
      )`;
      
      const params = [
        values.modo,
        values.ocupacion,
        values.averia,
        values.coord_x,
        values.coord_y,
        values.coord_z,
        values.matricula,
        values.pasillo,
        values.tipo_orden,
        values.fin_orden_estado,
        values.fin_orden_resultado
      ];
      
      db.run(sql, params, function(err) {
        db.close();
        
        if (err) {
          reject(new Error(`Error al insertar en la base de datos: ${err.message}`));
          return;
        }
        
        console.log(`Registro insertado correctamente con ID: ${this.lastID}`);
        resolve(this.lastID);
      });
    });
  });
}

// Función principal
async function main() {
  try {
    // Leer valores del PLC
    const plcValues = await readPLCValues();
    
    // Insertar valores en la base de datos
    await insertIntoDatabase(plcValues);
    
    console.log('Proceso completado con éxito');
  } catch (error) {
    console.error('Error:', error);
  }
}

// Ejecutar la función principal
main();
