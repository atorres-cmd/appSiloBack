/**
 * Script para limpiar las tablas de MariaDB y asegurar que solo exista una fila con id=1
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

// Función para limpiar una tabla específica
async function limpiarTabla(nombreTabla, campos, valoresIniciales) {
  try {
    console.log(`\nLimpiando tabla ${nombreTabla}...`);
    
    // 1. Contar registros actuales
    const conteoInicial = await query(`SELECT COUNT(*) as total FROM ${nombreTabla}`);
    console.log(`Registros actuales en ${nombreTabla}: ${conteoInicial[0].total}`);
    
    // 2. Eliminar todos los registros excepto el id=1
    const eliminados = await query(`DELETE FROM ${nombreTabla} WHERE id != 1`);
    console.log(`Registros eliminados con id != 1: ${eliminados.affectedRows || 0}`);
    
    // 3. Verificar si existe el registro con id=1
    const existeId1 = await query(`SELECT COUNT(*) as existe FROM ${nombreTabla} WHERE id = 1`);
    
    if (existeId1[0].existe === 0) {
      // 4. Si no existe id=1, insertar un registro inicial
      const camposStr = ['id', ...campos].join(', ');
      const valoresStr = ['1', ...valoresIniciales].join(', ');
      
      await query(`INSERT INTO ${nombreTabla} (${camposStr}) VALUES (${valoresStr})`);
      console.log(`Registro inicial con id=1 insertado en ${nombreTabla}`);
    } else {
      console.log(`El registro con id=1 ya existe en ${nombreTabla}`);
    }
    
    // 5. Mostrar el registro actual
    const registroActual = await query(`SELECT * FROM ${nombreTabla} WHERE id = 1`);
    mostrarResultados(`REGISTRO ACTUAL EN ${nombreTabla}`, registroActual);
    
    return true;
  } catch (error) {
    console.error(`Error al limpiar la tabla ${nombreTabla}:`, error);
    return false;
  }
}

// Función principal para limpiar todas las tablas
async function limpiarTablas() {
  try {
    console.log('\n*** LIMPIEZA DE TABLAS DE MARIADB ***\n');
    
    // Limpiar tabla TLV1_Status
    await limpiarTabla(
      'TLV1_Status',
      ['modo', 'ocupacion', 'averia', 'matricula', 'pasillo_actual', 'x_actual', 'y_actual', 'z_actual', 'estadoFinOrden', 'resultadoFinOrden'],
      ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
    );
    
    // Limpiar tabla TLV2_Status
    await limpiarTabla(
      'TLV2_Status',
      ['modo', 'ocupacion', 'averia', 'matricula', 'pasillo_actual', 'x_actual', 'y_actual', 'z_actual', 'estadoFinOrden', 'resultadoFinOrden'],
      ['0', '0', '0', '0', '0', '0', '0', '0', '0', '0']
    );
    
    // Limpiar tabla PT_Status
    await limpiarTabla(
      'PT_Status',
      ['ocupacion', 'estado', 'situacion', 'posicion'],
      ['0', '0', '0', '0']
    );
    
    // Verificar el resultado final
    const conteoFinal = await query(`
      SELECT 'TLV1_Status' as tabla, COUNT(*) as total_registros FROM TLV1_Status
      UNION
      SELECT 'TLV2_Status' as tabla, COUNT(*) as total_registros FROM TLV2_Status
      UNION
      SELECT 'PT_Status' as tabla, COUNT(*) as total_registros FROM PT_Status
    `);
    mostrarResultados('CONTEO FINAL DE REGISTROS POR TABLA', conteoFinal);
    
    console.log('\n*** LIMPIEZA FINALIZADA ***\n');
    
  } catch (error) {
    console.error('Error al limpiar las tablas:', error);
  } finally {
    // Cerrar la conexión para que el script termine
    process.exit(0);
  }
}

// Ejecutar la función principal
limpiarTablas();
