// Script para verificar los datos en la base de datos
const { DataSource } = require('typeorm');
const path = require('path');
const fs = require('fs');

// Verificar si la base de datos existe
const dbPath = path.join(__dirname, '../tlv_data.sqlite');
if (fs.existsSync(dbPath)) {
  console.log(`Base de datos encontrada en: ${dbPath}`);
} else {
  console.log(`¡ADVERTENCIA! Base de datos NO encontrada en: ${dbPath}`);
}

// Definir la entidad TLV1Record
class TLV1Record {
  constructor() {
    this.id = 0;
    this.timestamp = new Date();
    this.modo = 0;
    this.ocupacion = false;
    this.averia = false;
    this.coord_x = 0;
    this.coord_y = 0;
    this.coord_z = 0;
    this.matricula = 0;
    this.pasillo = 0;
    this.tipo_orden = 0;
    this.fin_orden_estado = 0;
    this.fin_orden_resultado = 0;
  }
}

// Definir la entidad TLV2Record
class TLV2Record {
  constructor() {
    this.id = 0;
    this.timestamp = new Date();
    this.modo = 0;
    this.ocupacion = false;
    this.averia = false;
    this.coord_x = 0;
    this.coord_y = 0;
    this.coord_z = 0;
    this.matricula = 0;
    this.pasillo = 0;
    this.tipo_orden = 0;
    this.fin_orden_estado = 0;
    this.fin_orden_resultado = 0;
  }
}

// Configuración de la base de datos
const dataSource = new DataSource({
  type: 'sqlite',
  database: dbPath,
  entities: [TLV1Record, TLV2Record],
  synchronize: false,
  logging: false
});

// Función principal
async function main() {
  try {
    // Inicializar la conexión a la base de datos
    await dataSource.initialize();
    console.log('Conexión a la base de datos establecida');

    // Verificar si las tablas existen
    const queryRunner = dataSource.createQueryRunner();
    const tables = await queryRunner.query("SELECT name FROM sqlite_master WHERE type='table';");
    console.log('Tablas en la base de datos:');
    console.log(tables);

    // Consultar datos de TLV1 usando SQL directo
    try {
      const tlv1Records = await queryRunner.query("SELECT * FROM tlv1_record;");
      console.log(`Registros de TLV1 encontrados: ${tlv1Records.length}`);
      if (tlv1Records.length > 0) {
        console.log('Datos de TLV1:');
        console.log(tlv1Records);
      } else {
        console.log('No se encontraron registros de TLV1');
      }
    } catch (error) {
      console.error('Error al leer datos de TLV1:', error);
    }

    // Consultar datos de TLV2 usando SQL directo
    try {
      const tlv2Records = await queryRunner.query("SELECT * FROM tlv2_record;");
      console.log(`Registros de TLV2 encontrados: ${tlv2Records.length}`);
      if (tlv2Records.length > 0) {
        console.log('Datos de TLV2:');
        console.log(tlv2Records);
      } else {
        console.log('No se encontraron registros de TLV2');
      }
    } catch (error) {
      console.error('Error al leer datos de TLV2:', error);
    }

    // Verificar la estructura de la tabla TLV1
    try {
      const tlv1Structure = await queryRunner.query("PRAGMA table_info(tlv1_record);");
      console.log('Estructura de la tabla TLV1:');
      console.log(tlv1Structure);
    } catch (error) {
      console.error('Error al obtener la estructura de TLV1:', error);
    }

    // Verificar la estructura de la tabla TLV2
    try {
      const tlv2Structure = await queryRunner.query("PRAGMA table_info(tlv2_record);");
      console.log('Estructura de la tabla TLV2:');
      console.log(tlv2Structure);
    } catch (error) {
      console.error('Error al obtener la estructura de TLV2:', error);
    }

  } catch (error) {
    console.error('Error general:', error);
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
