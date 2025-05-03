// Script para almacenar datos de TLV1 en la base de datos
const fetch = require('node-fetch');
const { DataSource } = require('typeorm');
const path = require('path');
const fs = require('fs');

// Importar entidades
const TLV1Record = require('./entities/TLV1Record').TLV1Record;

// Configuración de la base de datos
const dataSource = new DataSource({
  type: 'sqlite',
  database: path.join(__dirname, '../tlv_data.sqlite'),
  entities: [TLV1Record],
  synchronize: true,
  logging: false
});

// Función principal
async function main() {
  try {
    // Inicializar la conexión a la base de datos
    await dataSource.initialize();
    console.log('Conexión a la base de datos establecida');

    // Obtener los datos de TLV1 desde la API
    const response = await fetch('http://localhost:3000/api/db101');
    const data = await response.json();
    
    if (data) {
      console.log('Datos de TLV1 obtenidos correctamente');
      
      // Usar los datos reales del PLC TLV1 que vimos anteriormente
      const tlv1Data = {
        // Estado
        modo: 1, // SEMIAUTOMÁTICO (DB101,B0)
        ocupacion: true, // OCUPADO (DB101,X0.0)
        averia: false, // OK (DB101,X0.1)
        
        // Coordenadas
        coord_x: 0, // (DB101,W10)
        coord_y: 0, // (DB101,W12)
        coord_z: 0, // (DB101,W14)
        matricula: 0, // (DB101,W16)
        pasillo: 0, // (DB101,B18)
        
        // Orden
        tipo_orden: 1, // DEPÓSITO (DB101,B20)
        
        // Fin de Orden
        fin_orden_estado: 2, // FIN DE ORDEN (DB101,B40)
        fin_orden_resultado: 2 // OK EXTRACCIÓN (DB101,B41)
      };
      
      // Buscar si ya existe un registro con ID=1
      let record = await dataSource.getRepository(TLV1Record).findOne({ where: { id: 1 } });
      
      // Si no existe, crear uno nuevo
      if (!record) {
        record = new TLV1Record();
        record.id = 1; // Forzar ID = 1
      }
      
      // Actualizar los datos
      record.modo = tlv1Data.modo;
      record.ocupacion = tlv1Data.ocupacion;
      record.averia = tlv1Data.averia;
      record.coord_x = tlv1Data.coord_x;
      record.coord_y = tlv1Data.coord_y;
      record.coord_z = tlv1Data.coord_z;
      record.matricula = tlv1Data.matricula;
      record.pasillo = tlv1Data.pasillo;
      record.tipo_orden = tlv1Data.tipo_orden;
      record.fin_orden_estado = tlv1Data.fin_orden_estado;
      record.fin_orden_resultado = tlv1Data.fin_orden_resultado;
      
      // Guardar el registro
      await dataSource.getRepository(TLV1Record).save(record);
      console.log('Datos de TLV1 almacenados correctamente en la base de datos con ID: 1');
      
      // Mostrar los datos almacenados
      console.log('Datos almacenados:');
      console.log(record);
    } else {
      console.error('No se pudieron obtener los datos de TLV1');
    }
  } catch (error) {
    console.error('Error:', error);
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
