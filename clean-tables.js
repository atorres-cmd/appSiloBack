/**
 * Script para limpiar las tablas y reiniciarlas con solo una fila (id=1)
 * 
 * Este script elimina todas las filas de las tablas TLV1_Status, TLV2_Status y PT_Status,
 * y luego inserta una fila inicial con id=1 en cada una.
 */

const { query } = require('./src/db/mariadb-config');

async function cleanTables() {
  try {
    console.log('=== Iniciando limpieza de tablas ===');
    
    // Verificar conexión a la base de datos
    console.log('Verificando conexión a la base de datos...');
    await query('SELECT 1');
    console.log('✅ Conexión a la base de datos establecida');
    
    // Limpiar tabla TLV1_Status
    console.log('\nLimpiando tabla TLV1_Status...');
    await query('DELETE FROM TLV1_Status');
    console.log('✅ Tabla TLV1_Status limpiada');
    
    // Insertar fila inicial en TLV1_Status
    console.log('Insertando fila inicial en TLV1_Status...');
    await query(`
      INSERT INTO TLV1_Status 
      (id, modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual, estadoFinOrden, resultadoFinOrden)
      VALUES (1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
    `);
    console.log('✅ Fila inicial insertada en TLV1_Status');
    
    // Limpiar tabla TLV2_Status
    console.log('\nLimpiando tabla TLV2_Status...');
    await query('DELETE FROM TLV2_Status');
    console.log('✅ Tabla TLV2_Status limpiada');
    
    // Insertar fila inicial en TLV2_Status
    console.log('Insertando fila inicial en TLV2_Status...');
    await query(`
      INSERT INTO TLV2_Status 
      (id, modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual, estadoFinOrden, resultadoFinOrden)
      VALUES (1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)
    `);
    console.log('✅ Fila inicial insertada en TLV2_Status');
    
    // Limpiar tabla PT_Status
    console.log('\nLimpiando tabla PT_Status...');
    await query('DELETE FROM PT_Status');
    console.log('✅ Tabla PT_Status limpiada');
    
    // Insertar fila inicial en PT_Status
    console.log('Insertando fila inicial en PT_Status...');
    await query(`
      INSERT INTO PT_Status 
      (id, ocupacion, estado, situacion, posicion)
      VALUES (1, 0, 0, 0, 1)
    `);
    console.log('✅ Fila inicial insertada en PT_Status');
    
    // Verificar conteos
    console.log('\nVerificando conteos de filas:');
    const tlv1Count = await query('SELECT COUNT(*) as count FROM TLV1_Status');
    console.log(`- TLV1_Status: ${tlv1Count[0].count} fila(s)`);
    
    const tlv2Count = await query('SELECT COUNT(*) as count FROM TLV2_Status');
    console.log(`- TLV2_Status: ${tlv2Count[0].count} fila(s)`);
    
    const ptCount = await query('SELECT COUNT(*) as count FROM PT_Status');
    console.log(`- PT_Status: ${ptCount[0].count} fila(s)`);
    
    console.log('\n=== Limpieza de tablas completada con éxito ===');
    process.exit(0);
  } catch (error) {
    console.error('Error durante la limpieza de tablas:', error);
    process.exit(1);
  }
}

// Ejecutar la limpieza
cleanTables();
