/**
 * Script para configurar MariaDB para Operator Insight
 * 
 * Este script configura la base de datos para el proyecto Operator Insight
 * utilizando la instalación portable de MariaDB.
 */

const mysql = require('mysql2/promise');
const path = require('path');
const fs = require('fs');

// Configuración de MariaDB
const config = {
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: '',
  multipleStatements: true
};

// Función para crear la base de datos y las tablas
async function initializeDatabase() {
  try {
    console.log('Conectando a MariaDB...');
    
    // Conectar a MariaDB
    const connection = await mysql.createConnection(config);
    
    console.log('Conexión establecida correctamente.');
    
    // Crear la base de datos si no existe
    console.log('Creando la base de datos operator_insight...');
    await connection.query('CREATE DATABASE IF NOT EXISTS operator_insight');
    
    // Usar la base de datos
    console.log('Usando la base de datos operator_insight...');
    await connection.query('USE operator_insight');
    
    // Crear la tabla de componentes
    console.log('Creando la tabla components...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS components (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        type ENUM('transelevador', 'transferidor', 'puente', 'elevador') NOT NULL,
        status ENUM('active', 'inactive', 'error', 'maintenance') NOT NULL DEFAULT 'inactive',
        position_x FLOAT,
        position_y FLOAT,
        position_z FLOAT,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Crear la tabla de alarmas
    console.log('Creando la tabla alarms...');
    await connection.query(`
      CREATE TABLE IF NOT EXISTS alarms (
        id VARCHAR(36) PRIMARY KEY,
        component_id VARCHAR(36) NOT NULL,
        type ENUM('error', 'warning', 'info', 'success') NOT NULL,
        message TEXT NOT NULL,
        active BOOLEAN NOT NULL DEFAULT TRUE,
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        resolved_at TIMESTAMP NULL,
        FOREIGN KEY (component_id) REFERENCES components(id)
      )
    `);
    
    // Insertar datos de ejemplo para los componentes
    console.log('Insertando datos de ejemplo para los componentes...');
    
    // Verificar si ya existen componentes
    const [rows] = await connection.query('SELECT COUNT(*) as count FROM components');
    
    if (rows[0].count === 0) {
      // Insertar transelevadores
      await connection.query(`
        INSERT INTO components (id, name, type, status, position_x, position_y, position_z)
        VALUES
          ('t1', 'Transelevador 1', 'transelevador', 'active', 1, 2, 0),
          ('t2', 'Transelevador 2', 'transelevador', 'active', 5, 3, 0);
      `);
      
      // Insertar carro transferidor
      await connection.query(`
        INSERT INTO components (id, name, type, status, position_x, position_y, position_z)
        VALUES ('ct', 'Carro Transferidor', 'transferidor', 'active', 3, 0, 0);
      `);
      
      // Insertar puente
      await connection.query(`
        INSERT INTO components (id, name, type, status, position_x, position_y, position_z)
        VALUES ('p1', 'Puente', 'puente', 'active', 0, 2, 0);
      `);
      
      // Insertar elevador
      await connection.query(`
        INSERT INTO components (id, name, type, status, position_x, position_y, position_z)
        VALUES ('el1', 'Elevador', 'elevador', 'active', 12, 0, 0);
      `);
      
      console.log('Datos de ejemplo insertados correctamente.');
    } else {
      console.log('Los componentes ya existen en la base de datos.');
    }
    
    // Insertar algunas alarmas de ejemplo
    console.log('Insertando alarmas de ejemplo...');
    
    // Verificar si ya existen alarmas
    const [alarmRows] = await connection.query('SELECT COUNT(*) as count FROM alarms');
    
    if (alarmRows[0].count === 0) {
      await connection.query(`
        INSERT INTO alarms (id, component_id, type, message, active)
        VALUES
          ('a1', 't1', 'warning', 'Batería baja en el transelevador 1', TRUE),
          ('a2', 't2', 'error', 'Error de comunicación en el transelevador 2', TRUE),
          ('a3', 'ct', 'info', 'Mantenimiento programado para el carro transferidor', FALSE);
      `);
      
      console.log('Alarmas de ejemplo insertadas correctamente.');
    } else {
      console.log('Las alarmas ya existen en la base de datos.');
    }
    
    // Cerrar la conexión
    await connection.end();
    
    console.log('Base de datos inicializada correctamente.');
    return true;
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    return false;
  }
}

// Función principal
async function main() {
  try {
    console.log('=== Configuración de MariaDB para Operator Insight ===');
    
    // Inicializar la base de datos
    const inicializado = await initializeDatabase();
    
    if (inicializado) {
      console.log('=== Configuración completada con éxito ===');
      console.log('Ahora puede iniciar el backend con la integración de MariaDB ejecutando:');
      console.log('node src/start-with-mariadb.js');
    } else {
      console.log('No se pudo inicializar la base de datos. Por favor, verifique los logs para más información.');
    }
  } catch (error) {
    console.error('Error durante la configuración:', error);
  }
}

// Ejecutar la función principal
main().then(() => process.exit(0)).catch(err => {
  console.error(err);
  process.exit(1);
});
