// Script para ejecutar consultas SQL en la base de datos SQLite
const { DataSource } = require('typeorm');
const path = require('path');
const fs = require('fs');

// Verificar si la base de datos existe
const dbPath = path.join(__dirname, '../tlv_data.sqlite');
if (fs.existsSync(dbPath)) {
  console.log(`Base de datos encontrada en: ${dbPath}`);
} else {
  console.error(`¡ERROR! Base de datos NO encontrada en: ${dbPath}`);
  process.exit(1);
}

// Configuración de la base de datos
const dataSource = new DataSource({
  type: 'sqlite',
  database: dbPath,
  synchronize: false,
  logging: false
});

// Consultas predefinidas
const QUERIES = {
  'tlv1': 'SELECT * FROM tlv1_record',
  'tlv2': 'SELECT * FROM tlv2_record LIMIT 5',
  'tables': "SELECT name FROM sqlite_master WHERE type='table'",
  'tlv1_structure': "PRAGMA table_info(tlv1_record)",
  'tlv2_structure': "PRAGMA table_info(tlv2_record)"
};

// Obtener la consulta a ejecutar desde los argumentos de la línea de comandos
const queryName = process.argv[2];
const customQuery = process.argv[3];

// Función principal
async function main() {
  try {
    // Inicializar la conexión a la base de datos
    await dataSource.initialize();
    console.log('Conexión a la base de datos establecida');

    // Ejecutar la consulta
    const queryRunner = dataSource.createQueryRunner();
    let results;

    if (queryName && QUERIES[queryName]) {
      // Ejecutar consulta predefinida
      console.log(`Ejecutando consulta predefinida: ${queryName}`);
      console.log(`SQL: ${QUERIES[queryName]}`);
      results = await queryRunner.query(QUERIES[queryName]);
    } else if (customQuery) {
      // Ejecutar consulta personalizada
      console.log(`Ejecutando consulta personalizada: ${customQuery}`);
      results = await queryRunner.query(customQuery);
    } else {
      // Mostrar ayuda si no se proporciona una consulta válida
      console.log('Uso: node query-db.js [nombre_consulta | "consulta_sql_personalizada"]');
      console.log('Consultas predefinidas disponibles:');
      for (const [name, query] of Object.entries(QUERIES)) {
        console.log(`  - ${name}: ${query}`);
      }
      process.exit(0);
    }

    // Mostrar resultados
    console.log('\nResultados:');
    if (Array.isArray(results) && results.length > 0) {
      console.log(`Se encontraron ${results.length} registros`);
      console.table(results);
    } else {
      console.log('No se encontraron resultados o la consulta no devolvió registros');
      console.log(results);
    }

  } catch (error) {
    console.error('Error al ejecutar la consulta:', error);
  } finally {
    // Cerrar la conexión a la base de datos
    if (dataSource.isInitialized) {
      await dataSource.destroy();
      console.log('Conexión a la base de datos cerrada');
    }
  }
}

// Ejecutar la función principal
main();
