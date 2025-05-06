// src/controllers/ptMariaDBController.js
const { query } = require('../db/mariadb-config');
const { logger } = require('../utils/logger');
const nodes7 = require('nodes7');

/**
 * Controlador para sincronizar datos del PLC con la tabla PT_Status de MariaDB
 */
class PTMariaDBController {
  /**
   * Lee los datos del PLC y los guarda en la tabla PT_Status
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
          message: 'No se pudieron leer los datos del PLC para el Puente Transferidor'
        });
      }
      
      // Convertir datos del PLC al formato de la tabla PT_Status
      const dbData = this.convertPLCDataToDBFormat(plcData);
      
      // Guardar datos en la base de datos
      await this.saveToDatabase(dbData);
      
      // Responder con los datos guardados
      res.json({
        success: true,
        message: 'Datos del Puente Transferidor sincronizados correctamente',
        data: dbData
      });
    } catch (error) {
      logger.error('Error al sincronizar datos del Puente Transferidor con MariaDB:', error);
      res.status(500).json({
        success: false,
        message: 'Error al sincronizar datos del Puente Transferidor',
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
            logger.error('Error al conectar con el PLC para Puente Transferidor:', err);
            reject(err);
            return;
          }
          
          // Añadir variables para leer (las que coinciden con los campos de PT_Status)
          conn.addItems([
            'DB110,B30', // ocupacion
            'DB110,B31', // estado
            'DB110,B32', // situacion
            'DB110,B33'  // posicion
          ]);
          
          // Leer todas las variables
          conn.readAllItems((err, values) => {
            // Desconectar del PLC después de leer
            conn.dropConnection(() => {
              logger.info('Desconectado del PLC después de leer valores del Puente Transferidor');
            });
            
            if (err) {
              logger.error('Error al leer valores del PLC para Puente Transferidor:', err);
              reject(err);
              return;
            }
            
            // Mostrar los valores crudos exactos que se leen del PLC
            console.log('\n==== VALORES CRUDOS LEÍDOS DEL PLC (DB110) ====');
            console.log(JSON.stringify(values, null, 2));
            console.log('DB110,DBB30 (ocupacion):', values['DB110,DBB30'], typeof values['DB110,DBB30']);
            console.log('DB110,DBB31 (estado):', values['DB110,DBB31'], typeof values['DB110,DBB31']);
            console.log('DB110,DBB32 (situacion):', values['DB110,DBB32'], typeof values['DB110,DBB32']);
            console.log('DB110,DBB33 (posicion):', values['DB110,DBB33'], typeof values['DB110,DBB33']);
            console.log('===============================================\n');
            
            // Verificar si los valores del PLC son válidos
            const hasValidValues = Object.values(values).some(value => 
              value !== null && value !== undefined);
            
            if (hasValidValues) {
              logger.info('Valores del Puente Transferidor leídos correctamente del PLC');
              resolve(values);
            } else {
              reject(new Error('No se obtuvieron valores válidos del PLC para el Puente Transferidor'));
            }
          });
        });
      });
    } catch (error) {
      logger.error('Error al leer datos del PLC para Puente Transferidor:', error);
      return null;
    }
  }
  
  /**
   * Convierte los datos del PLC al formato de la tabla PT_Status
   * @param {Object} plcData - Datos leídos del PLC
   * @returns {Object} Datos en formato para la tabla PT_Status
   */
  convertPLCDataToDBFormat(plcData) {
    return {
      ocupacion: plcData['DB110,B30'] !== undefined ? plcData['DB110,B30'] : 0,
      estado: plcData['DB110,B31'] !== undefined ? plcData['DB110,B31'] : 0,
      situacion: plcData['DB110,B32'] !== undefined ? plcData['DB110,B32'] : 0,
      posicion: plcData['DB110,B33'] !== undefined ? plcData['DB110,B33'] : 1
    };
  }
  
  /**
   * Guarda los datos en la tabla PT_Status
   * @param {Object} data - Datos a guardar
   * @returns {Promise<void>}
   */
  async saveToDatabase(data) {
    try {
      console.log('Intentando guardar datos en PT_Status:', data);
      
      // Verificar que los datos sean válidos
      if (data === null || data === undefined) {
        console.error('Error: Los datos a guardar son nulos o indefinidos');
        return;
      }
      
      // Verificar que los campos necesarios existan
      if (data.ocupacion === undefined || data.estado === undefined || 
          data.situacion === undefined || data.posicion === undefined) {
        console.error('Error: Faltan campos requeridos en los datos:', data);
        return;
      }
      
      const sql = `
        INSERT INTO PT_Status 
        (ocupacion, estado, situacion, posicion)
        VALUES (?, ?, ?, ?)
      `;
      
      const params = [
        data.ocupacion,
        data.estado,
        data.situacion,
        data.posicion
      ];
      
      console.log('Ejecutando consulta SQL:', sql);
      console.log('Parámetros:', params);
      
      const result = await query(sql, params);
      console.log('Resultado de la inserción:', result);
      logger.info('Datos guardados correctamente en la tabla PT_Status');
    } catch (error) {
      console.error('Error detallado al guardar datos en PT_Status:', error);
      logger.error('Error al guardar datos en la tabla PT_Status:', error);
      throw error;
    }
  }
  
  /**
   * Configura una tarea programada para sincronizar datos periódicamente
   * @param {number} intervalSeconds - Intervalo en segundos
   */
  setupScheduledSync(intervalSeconds = 30) {
    // Configurar intervalo para sincronización automática
    setInterval(async () => {
      try {
        logger.info(`Ejecutando sincronización programada de datos del Puente Transferidor a MariaDB...`);
        const plcData = await this.readPLCData();
        
        if (plcData) {
          const dbData = this.convertPLCDataToDBFormat(plcData);
          await this.saveToDatabase(dbData);
          logger.info('Sincronización programada del Puente Transferidor completada con éxito');
        } else {
          logger.warn('No se pudieron leer datos del PLC para el Puente Transferidor en la sincronización programada');
        }
      } catch (error) {
        logger.error('Error en la sincronización programada del Puente Transferidor:', error);
      }
    }, intervalSeconds * 1000);
    
    logger.info(`Sincronización automática del Puente Transferidor configurada cada ${intervalSeconds} segundos`);
  }
  
  /**
   * Inicializa la tabla PT_Status en MariaDB
   * @returns {Promise<void>}
   */
  async initPTStatusTable() {
    try {
      // Crear tabla PT_Status si no existe
      await query(`
        CREATE TABLE IF NOT EXISTS PT_Status (
          id INT AUTO_INCREMENT PRIMARY KEY,
          ocupacion INT DEFAULT 0,
          estado INT DEFAULT 0,
          situacion INT DEFAULT 0,
          posicion INT DEFAULT 1,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
      
      // Verificar si hay datos en la tabla
      const result = await query('SELECT COUNT(*) as count FROM PT_Status');
      
      // Manejar diferentes formatos de resultado
      let count = 0;
      if (Array.isArray(result) && result.length > 0) {
        // Si el resultado es un array (como [rows, fields])
        if (result[0] && Array.isArray(result[0]) && result[0].length > 0) {
          count = result[0][0].count || 0;
        } else if (result[0] && typeof result[0] === 'object') {
          count = result[0].count || 0;
        }
      }
      
      logger.info(`Verificación de datos en PT_Status: ${count} registros encontrados`);
      
      // Si no hay datos, insertar datos iniciales
      if (count === 0) {
        await query(`
          INSERT INTO PT_Status 
          (ocupacion, estado, situacion, posicion)
          VALUES (0, 0, 0, 1)
        `);
        logger.info('Datos iniciales para PT_Status insertados correctamente');
      }
      
      logger.info('Tabla PT_Status creada o ya existente');
    } catch (error) {
      logger.error('Error al inicializar la tabla PT_Status:', error);
      throw error;
    }
  }
  
  /**
   * Obtiene los datos actuales del Puente Transferidor desde MariaDB
   * @param {Object} req - Objeto de solicitud Express
   * @param {Object} res - Objeto de respuesta Express
   */
  async getPTStatus(req, res) {
    try {
      const [rows] = await query('SELECT * FROM PT_Status ORDER BY id DESC LIMIT 1');
      
      if (rows.length > 0) {
        res.json({
          success: true,
          data: rows[0]
        });
      } else {
        res.status(404).json({
          success: false,
          message: 'No se encontraron datos del Puente Transferidor'
        });
      }
    } catch (error) {
      logger.error('Error al obtener datos del Puente Transferidor desde MariaDB:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener datos del Puente Transferidor',
        error: error.message
      });
    }
  }
}

// Inicializar la tabla PT_Status al cargar el módulo
const ptController = new PTMariaDBController();
ptController.initPTStatusTable()
  .then(() => {
    // Iniciar sincronización automática cada 30 segundos
    ptController.setupScheduledSync(30);
  })
  .catch(error => {
    logger.error('Error al inicializar el controlador del Puente Transferidor:', error);
  });

module.exports = ptController;
