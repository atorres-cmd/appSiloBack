/**
 * Script para probar la actualización de una sola fila en una tabla
 * 
 * Este script crea una tabla de prueba, inserta una fila con id=1,
 * y luego la actualiza varias veces para verificar que siempre se actualiza
 * la misma fila en lugar de insertar nuevas filas.
 */

const mysql = require('mysql2/promise');

async function testSingleRowUpdate() {
  let connection;
  
  try {
    console.log('=== Iniciando prueba de actualización de una sola fila ===');
    
    // Crear conexión a MariaDB
    console.log('Conectando a MariaDB...');
    connection = await mysql.createConnection({
      host: 'localhost',
      port: 3306,
      user: 'root', // Usuario por defecto después de la inicialización
      password: ''   // Sin contraseña por defecto
    });
    
    console.log('✅ Conexión establecida');
    
    // Crear base de datos de prueba
    console.log('\nCreando base de datos de prueba...');
    await connection.execute('CREATE DATABASE IF NOT EXISTS test_db');
    console.log('✅ Base de datos creada');
    
    // Usar la base de datos de prueba
    await connection.execute('USE test_db');
    
    // Crear tabla de prueba
    console.log('\nCreando tabla de prueba...');
    await connection.execute(`
      CREATE TABLE IF NOT EXISTS test_table (
        id INT PRIMARY KEY,
        value INT,
        message VARCHAR(100),
        timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    console.log('✅ Tabla creada');
    
    // Verificar si ya existe una fila con id=1
    console.log('\nVerificando si ya existe una fila con id=1...');
    const [rows] = await connection.execute('SELECT COUNT(*) as count FROM test_table WHERE id = 1');
    const count = rows[0].count;
    
    if (count === 0) {
      // Insertar fila inicial
      console.log('No existe, insertando fila inicial...');
      await connection.execute(`
        INSERT INTO test_table (id, value, message)
        VALUES (1, 0, 'Fila inicial')
      `);
      console.log('✅ Fila inicial insertada');
    } else {
      console.log('Ya existe una fila con id=1');
    }
    
    // Mostrar el estado inicial
    console.log('\nEstado inicial de la tabla:');
    const [initialState] = await connection.execute('SELECT * FROM test_table');
    console.log(initialState);
    
    // Realizar varias actualizaciones
    console.log('\nRealizando actualizaciones...');
    
    for (let i = 1; i <= 5; i++) {
      // Actualizar la fila con id=1
      await connection.execute(`
        UPDATE test_table
        SET value = ?, message = ?
        WHERE id = 1
      `, [i * 10, `Actualización #${i}`]);
      
      console.log(`✅ Actualización #${i} completada`);
      
      // Mostrar el estado después de la actualización
      const [currentState] = await connection.execute('SELECT * FROM test_table');
      console.log(`Estado después de la actualización #${i}:`, currentState);
      
      // Verificar el número total de filas
      const [rowCount] = await connection.execute('SELECT COUNT(*) as count FROM test_table');
      console.log(`Número total de filas: ${rowCount[0].count}`);
      
      // Pequeña pausa para que se note el cambio en el timestamp
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n=== Prueba completada con éxito ===');
    console.log('La tabla siempre tiene una sola fila (id=1) que se actualiza en lugar de insertar nuevas filas.');
    
  } catch (error) {
    console.error('Error durante la prueba:', error);
  } finally {
    // Cerrar conexión
    if (connection) {
      await connection.end();
      console.log('Conexión cerrada');
    }
  }
}

// Ejecutar la prueba
testSingleRowUpdate();
