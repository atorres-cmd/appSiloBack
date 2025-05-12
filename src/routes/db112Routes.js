// src/routes/db112Routes.js
const { Router } = require('express');
const { query } = require('../db/mariadb-config');
const { logger } = require('../utils/logger');
const nodes7 = require('nodes7');

// Implementamos un controlador simplificado directamente en este archivo
class SimplifiedDB112Controller {
  constructor() {
    this.syncInterval = null;
    console.log('Controlador simplificado de DB112 inicializado');
  }
  
  // Método para obtener el estado actual del CT desde la base de datos
  async getCTStatus() {
    try {
      // Consultar la tabla CT_Status para obtener el último registro
      const rows = await query('SELECT * FROM CT_Status ORDER BY id DESC LIMIT 1');
      
      if (!rows || rows.length === 0) {
        logger.warn('No se encontraron datos en la tabla CT_Status');
        return null;
      }
      
      logger.info(`Datos del CT obtenidos correctamente: ${JSON.stringify(rows[0])}`);
      return rows[0];
    } catch (error) {
      logger.error(`Error al consultar la tabla CT_Status: ${error}`);
      throw error;
    }
  }
  
  // Método para sincronizar los datos del PLC con la tabla CT_Status
  async syncDB112ToCT() {
    let conn = null;
    try {
      // Configuración del PLC
      const plcIP = process.env.PLC_IP || '10.21.178.100';
      const plcRack = parseInt(process.env.PLC_RACK || '0');
      const plcSlot = parseInt(process.env.PLC_SLOT || '3');
      
      logger.info(`Conectando al PLC en ${plcIP} (Rack: ${plcRack}, Slot: ${plcSlot})`);
      
      // Crear conexión al PLC
      conn = new nodes7();
      conn.setTranslationCB((tag) => {
        return tag; // Devolver el tag sin modificar
      });
      
      // Configurar la conexión
      await new Promise((resolve, reject) => {
        conn.initiateConnection({
          port: 102,
          host: plcIP,
          rack: plcRack,
          slot: plcSlot,
          timeout: 10000
        }, (err) => {
          if (err) {
            logger.error(`Error al conectar con el PLC: ${err}`);
            reject(err);
            return;
          }
          logger.info('Conexión con el PLC establecida correctamente');
          resolve();
        });
      });
      
      // Definir las variables a leer
      const variables = {
        'DB112,X130.0': 'StConectado',
        'DB112,X130.1': 'StDefecto',
        'DB112,X130.2': 'St_Auto',
        'DB112,X130.3': 'St_Semi',
        'DB112,X130.4': 'St_Manual',
        'DB112,X130.5': 'St_Puerta',
        'DB112,X130.6': 'St_Datos',
        'DB112,W132': 'MatEntrada',
        'DB112,W134': 'MatSalida',
        'DB112,B136': 'PasDestino',
        'DB112,B137': 'CicloTrabajo',
        'DB112,B140': 'PasActual',
        'DB112,B141': 'St_Carro'
      };
      
      // Añadir las variables a la lista de lectura
      await new Promise((resolve, reject) => {
        conn.addItems(Object.keys(variables));
        resolve();
      });
      
      // Leer los valores del PLC
      const values = await new Promise((resolve, reject) => {
        conn.readAllItems((err, values) => {
          if (err) {
            logger.error(`Error al leer datos del PLC: ${err}`);
            reject(err);
            return;
          }
          logger.info(`Datos leídos del PLC: ${JSON.stringify(values)}`);
          resolve(values);
        });
      });
      
      // Actualizar la tabla CT_Status con los valores leídos
      const updateCTSql = `
        UPDATE CT_Status 
        SET StConectado = ?, StDefecto = ?, St_Auto = ?, St_Semi = ?, St_Manual = ?, St_Puerta = ?, St_Datos = ?,
            MatEntrada = ?, MatSalida = ?, PasDestino = ?, CicloTrabajo = ?, PasActual = ?, St_Carro = ?,
            timestamp = CURRENT_TIMESTAMP
        WHERE id = 1
      `;
      
      // Preparar los valores para la actualización
      const ctValues = [
        values['DB112,X130.0'] === true ? 1 : 0,  // StConectado
        values['DB112,X130.1'] === true ? 1 : 0,  // StDefecto
        values['DB112,X130.2'] === true ? 1 : 0,  // St_Auto
        values['DB112,X130.3'] === true ? 1 : 0,  // St_Semi
        values['DB112,X130.4'] === true ? 1 : 0,  // St_Manual
        values['DB112,X130.5'] === true ? 1 : 0,  // St_Puerta
        values['DB112,X130.6'] === true ? 1 : 0,  // St_Datos
        values['DB112,W132'] || 0,               // MatEntrada
        values['DB112,W134'] || 0,               // MatSalida
        values['DB112,B136'] || 0,               // PasDestino
        values['DB112,B137'] || 0,               // CicloTrabajo
        values['DB112,B140'] || 0,               // PasActual
        values['DB112,B141'] || 0                // St_Carro
      ];
      
      await query(updateCTSql, ctValues);
      logger.info('Tabla CT_Status actualizada correctamente con datos reales del PLC');
      
      // Cerrar la conexión con el PLC
      if (conn) {
        conn.dropConnection();
        logger.info('Conexión con el PLC cerrada');
      }
      
      return true;
    } catch (error) {
      logger.error(`Error al sincronizar datos del DB112: ${error}`);
      logger.warn('No se actualizará la tabla CT_Status hasta que se pueda conectar con el PLC real');
      return false;
    } finally {
      // Asegurarse de cerrar la conexión en caso de error
      if (conn) {
        try {
          conn.dropConnection();
          logger.info('Conexión con el PLC cerrada en finally');
        } catch (err) {
          logger.error(`Error al cerrar la conexión con el PLC: ${err}`);
        }
      }
    }
  }
  
  // Método para configurar la sincronización programada
  setupScheduledSync(intervalSeconds = 30) {
    // Limpiar el intervalo existente si hay uno
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
    }
    
    // Configurar el nuevo intervalo
    this.syncInterval = setInterval(async () => {
      try {
        logger.info('Iniciando sincronización programada del DB112');
        await this.syncDB112ToCT();
        logger.info('Sincronización programada del DB112 completada');
      } catch (error) {
        logger.error(`Error en la sincronización programada del DB112: ${error}`);
      }
    }, intervalSeconds * 1000);
    
    logger.info(`Sincronización automática del DB112 configurada cada ${intervalSeconds} segundos`);
  }
}

// Crear una instancia del controlador simplificado
const db112Controller = new SimplifiedDB112Controller();

const createDB112Routes = () => {
  const router = Router();
  
  // Configurar la sincronización automática al iniciar (cada 30 segundos)
  db112Controller.setupScheduledSync(30);
  
  // Ruta para obtener el estado actual del CT
  router.get('/status', async (req, res) => {
    try {
      const status = await db112Controller.getCTStatus();
      if (!status) {
        return res.status(404).json({ success: false, message: 'No se encontraron datos del CT' });
      }
      res.json({ success: true, data: status });
    } catch (error) {
      console.error('Error al obtener estado del CT:', error);
      res.status(500).json({ success: false, message: 'Error al obtener estado del CT', error: error.message });
    }
  });

  // Ruta para sincronizar manualmente los datos del DB112 con CT_Status
  router.post('/sync', async (req, res) => {
    try {
      await db112Controller.syncDB112ToCT();
      res.json({ success: true, message: 'Sincronización manual del CT completada' });
    } catch (error) {
      console.error('Error en sincronización manual del CT:', error);
      res.status(500).json({ success: false, message: 'Error en sincronización manual del CT', error: error.message });
    }
  });

  return router;
};

module.exports = createDB112Routes;
