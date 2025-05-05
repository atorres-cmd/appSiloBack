const mysql = require('mysql2/promise');
const dotenv = require('dotenv');

// Cargar variables de entorno
dotenv.config();

// Configuración de la conexión a MariaDB
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  database: process.env.DB_NAME || 'operator_insight',
  user: process.env.DB_USER || 'ai',
  password: process.env.DB_PASSWORD || '0260',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

// Crear pool de conexiones
const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log('Conexión a MariaDB establecida correctamente');
    connection.release();
    return true;
  } catch (error) {
    console.error('Error al conectar con MariaDB:', error.message);
    return false;
  }
}

// Función para ejecutar consultas
async function query(sql, params) {
  try {
    const [results] = await pool.execute(sql, params);
    return results;
  } catch (error) {
    console.error('Error al ejecutar consulta SQL:', error.message);
    throw error;
  }
}

module.exports = {
  pool,
  query,
  testConnection
};
