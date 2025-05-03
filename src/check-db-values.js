// Script para verificar los valores almacenados en la base de datos
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

// Ruta a la base de datos
const dbPath = path.join(__dirname, '..', 'database.sqlite');

// Crear conexión a la base de datos
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error al conectar con la base de datos:', err.message);
    process.exit(1);
  }
  console.log('Conexión establecida con la base de datos SQLite');
});

// Consultar los datos de TLV1
db.get('SELECT * FROM tlv1_record WHERE id = 1', (err, row) => {
  if (err) {
    console.error('Error al consultar la tabla tlv1_record:', err.message);
  } else {
    console.log('Datos de TLV1 (ID=1):');
    console.log(row);
  }
  
  // Cerrar la conexión a la base de datos
  db.close((err) => {
    if (err) {
      console.error('Error al cerrar la base de datos:', err.message);
    } else {
      console.log('Conexión a la base de datos cerrada');
    }
  });
});
