/**
 * Script para consultar directamente las tablas de MariaDB
 * Este script utiliza la configuración de conexión existente
 */

const { query } = require('./src/db/mariadb-config');
const logger = require('./src/utils/logger');

// Función para mostrar los resultados de una consulta
function mostrarResultados(titulo, resultados) {
  console.log('\n' + '='.repeat(80));
  console.log(titulo);
  console.log('='.repeat(80));
  
  if (Array.isArray(resultados) && resultados.length > 0) {
    console.table(resultados);
  } else {
    console.log('No se encontraron resultados');
  }
}

// Función principal para ejecutar consultas
async function consultarTablas() {
  try {
    console.log('\n*** CONSULTA DE TABLAS DE MARIADB ***\n');
    
    // 1. Mostrar todas las tablas
    const tablas = await query('SHOW TABLES');
    mostrarResultados('TABLAS EN LA BASE DE DATOS', tablas);
    
    // 2. Contar registros en cada tabla
    const conteoRegistros = await query(`
      SELECT 'TLV1_Status' as tabla, COUNT(*) as total_registros FROM TLV1_Status
      UNION
      SELECT 'TLV2_Status' as tabla, COUNT(*) as total_registros FROM TLV2_Status
      UNION
      SELECT 'PT_Status' as tabla, COUNT(*) as total_registros FROM PT_Status
    `);
    mostrarResultados('CONTEO DE REGISTROS POR TABLA', conteoRegistros);
    
    // 3. Consultar datos de TLV1_Status
    const tlv1Data = await query('SELECT * FROM TLV1_Status WHERE id = 1');
    mostrarResultados('DATOS DE TLV1_Status (id=1)', tlv1Data);
    
    // 4. Consultar datos de TLV2_Status
    const tlv2Data = await query('SELECT * FROM TLV2_Status WHERE id = 1');
    mostrarResultados('DATOS DE TLV2_Status (id=1)', tlv2Data);
    
    // 5. Consultar datos de PT_Status
    const ptData = await query('SELECT * FROM PT_Status WHERE id = 1');
    mostrarResultados('DATOS DE PT_Status (id=1)', ptData);
    
    // 6. Verificar si hay registros con id diferente de 1 (no debería haber)
    const registrosNoId1 = await query(`
      SELECT 'TLV1_Status' as tabla, COUNT(*) as registros_no_id_1 FROM TLV1_Status WHERE id != 1
      UNION
      SELECT 'TLV2_Status' as tabla, COUNT(*) as registros_no_id_1 FROM TLV2_Status WHERE id != 1
      UNION
      SELECT 'PT_Status' as tabla, COUNT(*) as registros_no_id_1 FROM PT_Status WHERE id != 1
    `);
    mostrarResultados('REGISTROS CON ID DIFERENTE DE 1 (NO DEBERÍA HABER)', registrosNoId1);
    
    console.log('\n*** CONSULTA FINALIZADA ***\n');
    
  } catch (error) {
    console.error('Error al consultar las tablas:', error);
  } finally {
    // Cerrar la conexión para que el script termine
    process.exit(0);
  }
}

// Ejecutar la función principal
consultarTablas();
