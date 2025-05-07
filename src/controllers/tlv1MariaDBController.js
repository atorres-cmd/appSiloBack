// src/controllers/tlv1MariaDBController.js
const { query } = require('../db/mariadb-config');
const { logger } = require('../utils/logger');
const nodes7 = require('nodes7');

/**
 * Controlador para sincronizar datos del PLC con la tabla TLV1_Status de MariaDB
 */
class TLV1MariaDBController {
  /**
   * Lee los datos del PLC y los guarda en la tabla TLV1_Status
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   */
  async syncPLCToDatabase(req, res) {
    try {
      // Leer datos del PLC
      const plcData = await this.readPLCData();
      
      if (!plcData) {
        return res.status(500).json({
          success: false,
          message: 'No se pudieron leer los datos del PLC'
        });
      }
      
      // Convertir datos del PLC al formato de la tabla TLV1_Status
      const dbData = this.convertPLCDataToDBFormat(plcData);
      
      // Guardar datos en la base de datos
      await this.saveToDatabase(dbData);
      
      // Responder con los datos guardados
      res.json({
        success: true,
        message: 'Datos sincronizados correctamente',
        data: dbData
      });
    } catch (error) {
      logger.error('Error al sincronizar datos del PLC con MariaDB:', error);
      res.status(500).json({
        success: false,
        message: 'Error al sincronizar datos',
        error: error.message
      });
    }
  }
  
  /**
   * Lee los datos del PLC utilizando nodes7
   * @returns {Promise<Object>} Datos leídos del PLC
   */
  async readPLCData() {
    const conn = new nodes7();
    
    // Configuración de conexión al PLC
    const connectionParams = {
      host: process.env.PLC_IP || '10.21.178.100',
      port: 102,
      rack: parseInt(process.env.PLC_RACK || '0'),
      slot: parseInt(process.env.PLC_SLOT || '3'),
      timeout: 5000
    };
    
    try {
      // Crear una promesa para manejar la conexión asíncrona
      return await new Promise((resolve, reject) => {
        // Conectar al PLC
        conn.initiateConnection(connectionParams, (err) => {
          if (err) {
            logger.error('Error al conectar con el PLC:', err);
            reject(err);
            return;
          }
          
          // Añadir variables para leer (las que coinciden con los campos de TLV1_Status)
          conn.addItems([
            'DB101,B0',   // modo
            'DB101,B1',   // ocupacion
            'DB101,B2',   // averia
            'DB101,W16',  // matricula
            'DB101,B18',  // pasillo_actual
            'DB101,W10',  // x_actual
            'DB101,W12',  // y_actual
            'DB101,W14',  // z_actual
            'DB101,B40',  // estadoFinOrden
            'DB101,B41'   // resultadoFinOrden
          ]);
          
          // Leer todas las variables
          conn.readAllItems((err, values) => {
            // Desconectar del PLC después de leer
            conn.dropConnection(() => {
              logger.info('Desconectado del PLC después de leer valores');
            });
            
            if (err) {
              logger.error('Error al leer valores del PLC:', err);
              reject(err);
              return;
            }
            
            // Verificar si los valores del PLC son válidos
            const hasValidValues = Object.values(values).some(value => 
              value !== null && value !== undefined);
            
            if (hasValidValues) {
              logger.info('Valores leídos correctamente del PLC');
              resolve(values);
            } else {
              reject(new Error('No se obtuvieron valores válidos del PLC'));
            }
          });
        });
      });
    } catch (error) {
      logger.error('Error al leer datos del PLC:', error);
      return null;
    }
  }
  
  /**
   * Convierte los datos del PLC al formato de la tabla TLV1_Status
   * @param {Object} plcData - Datos leídos del PLC
   * @returns {Object} Datos en formato para la tabla TLV1_Status
   */
  convertPLCDataToDBFormat(plcData) {
    return {
      modo: plcData['DB101,B0'] !== undefined ? plcData['DB101,B0'] : 0,
      ocupacion: plcData['DB101,B1'] !== undefined ? plcData['DB101,B1'] : 0,
      averia: plcData['DB101,B2'] !== undefined ? plcData['DB101,B2'] : 0,
      matricula: plcData['DB101,W16'] !== undefined ? plcData['DB101,W16'] : 0,
      pasillo_actual: plcData['DB101,B18'] !== undefined ? plcData['DB101,B18'] : 0,
      x_actual: plcData['DB101,W10'] !== undefined ? plcData['DB101,W10'] : 0,
      y_actual: plcData['DB101,W12'] !== undefined ? plcData['DB101,W12'] : 0,
      z_actual: plcData['DB101,W14'] !== undefined ? plcData['DB101,W14'] : 0,
      estadoFinOrden: plcData['DB101,B40'] !== undefined ? plcData['DB101,B40'] : 0,
      resultadoFinOrden: plcData['DB101,B41'] !== undefined ? plcData['DB101,B41'] : 0
    };
  }
  
  /**
   * Guarda los datos en la tabla TLV1_Status
   * @param {Object} data - Datos a guardar
   * @returns {Promise<void>}
   */
  async saveToDatabase(data) {
    try {
      // Primero verificamos si existe la tabla y si tiene al menos una fila
      const checkResult = await query('SELECT COUNT(*) as count FROM TLV1_Status');
      const count = checkResult[0].count || 0;
      
      if (count === 0) {
        // Si no hay datos, insertamos la primera fila
        const insertSql = `
          INSERT INTO TLV1_Status 
          (id, modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual, estadoFinOrden, resultadoFinOrden)
          VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;
        
        const insertParams = [
          data.modo,
          data.ocupacion,
          data.averia,
          data.matricula,
          data.pasillo_actual,
          data.x_actual,
          data.y_actual,
          data.z_actual,
          data.estadoFinOrden,
          data.resultadoFinOrden
        ];
        
        await query(insertSql, insertParams);
        logger.info('Primera fila insertada en la tabla TLV1_Status');
      } else {
        // Si ya hay datos, actualizamos la primera fila (id=1)
        const updateSql = `
          UPDATE TLV1_Status 
          SET modo = ?, ocupacion = ?, averia = ?, matricula = ?, 
              pasillo_actual = ?, x_actual = ?, y_actual = ?, z_actual = ?, 
              estadoFinOrden = ?, resultadoFinOrden = ?, 
              timestamp = CURRENT_TIMESTAMP
          WHERE id = 1
        `;
        
        const updateParams = [
          data.modo,
          data.ocupacion,
          data.averia,
          data.matricula,
          data.pasillo_actual,
          data.x_actual,
          data.y_actual,
          data.z_actual,
          data.estadoFinOrden,
          data.resultadoFinOrden
        ];
        
        await query(updateSql, updateParams);
        logger.info('Datos actualizados en la fila 1 de la tabla TLV1_Status');
      }
    } catch (error) {
      logger.error('Error al guardar datos en la tabla TLV1_Status:', error);
      throw error;
    }
  }
  
  /**
   * Configura una tarea programada para sincronizar datos periódicamente
   * @param {number} intervalSeconds - Intervalo en segundos
   */
  setupScheduledSync(intervalSeconds = 60) {
    // Configurar intervalo para sincronización automática
    setInterval(async () => {
      try {
        logger.info(`Ejecutando sincronización programada de datos PLC a MariaDB...`);
        const plcData = await this.readPLCData();
        
        if (plcData) {
          const dbData = this.convertPLCDataToDBFormat(plcData);
          await this.saveToDatabase(dbData);
          logger.info('Sincronización programada completada con éxito');
        } else {
          logger.warn('No se pudieron leer datos del PLC en la sincronización programada');
        }
      } catch (error) {
        logger.error('Error en la sincronización programada:', error);
      }
    }, intervalSeconds * 1000);
    
    logger.info(`Sincronización automática configurada cada ${intervalSeconds} segundos`);
  }
}

module.exports = new TLV1MariaDBController();
