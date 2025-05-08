/**
 * Módulo para iniciar el servidor MariaDB específico
 * 
 * Este módulo exporta una función para iniciar el servidor MariaDB en el puerto 3003
 * y puede ser importado y utilizado por otros scripts.
 */

const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('../db/init-db');
const tlv1Routes = require('../routes/tlv1Routes');
const tlv1SyncRoutes = require('../routes/tlv1SyncRoutes');
const tlv1MariaDBController = require('../controllers/tlv1MariaDBController');
const tlv2Routes = require('../routes/tlv2Routes');
const tlv2SyncRoutes = require('../routes/tlv2SyncRoutes');
const tlv2MariaDBController = require('../controllers/tlv2MariaDBController');
const puenteRoutes = require('../routes/ptRoutes');
const puenteController = require('../controllers/ptMariaDBController');
const { logger } = require('./logger');

/**
 * Inicia el servidor MariaDB específico en el puerto 3003
 * @returns {Promise<Express.Application>} La instancia de Express del servidor MariaDB
 */
async function startMariaDBServer() {
  try {
    // Crear una instancia de Express
    const app = express();

    // Configurar middleware
    app.use(cors());
    app.use(express.json());

    // Configurar rutas para MariaDB
    app.use('/api/mariadb/tlv1', tlv1Routes);
    app.use('/api/mariadb/tlv2', tlv2Routes);
    app.use('/api/mariadb/puente', puenteRoutes);

    // Configurar rutas para la sincronización PLC-MariaDB
    app.use('/api/mariadb/tlv1/sync', tlv1SyncRoutes);
    app.use('/api/mariadb/tlv2/sync', tlv2SyncRoutes);

    // Ruta de documentación
    app.get('/api/mariadb', (req, res) => {
      res.json({
        message: 'API de MariaDB para Operator Insight',
        endpoints: {
          tlv1: {
            getCurrent: 'GET /api/mariadb/tlv1',
            getHistory: 'GET /api/mariadb/tlv1/history?limit=100',
            update: 'POST /api/mariadb/tlv1'
          },
          tlv2: {
            getCurrent: 'GET /api/mariadb/tlv2',
            getHistory: 'GET /api/mariadb/tlv2/history?limit=100',
            update: 'POST /api/mariadb/tlv2'
          },
          puente: {
            getCurrent: 'GET /api/mariadb/puente',
            sync: 'POST /api/mariadb/puente/sync',
            plc: 'GET /api/mariadb/puente/plc'
          }
        }
      });
    });

    // Inicializar la base de datos
    logger.info('Inicializando la base de datos MariaDB...');
    await initializeDatabase();
    
    // Definir un puerto específico (3003) para evitar conflictos
    const PORT = 3003;
    
    // Iniciar el servidor
    const server = app.listen(PORT, () => {
      logger.info(`Servidor con integración de MariaDB iniciado en el puerto ${PORT}`);
      logger.info('Rutas disponibles:');
      logger.info('- Documentación API: http://localhost:' + PORT + '/api/mariadb');
      logger.info('- TLV1 Status: http://localhost:' + PORT + '/api/mariadb/tlv1');
      logger.info('- TLV1 Sync: http://localhost:' + PORT + '/api/mariadb/tlv1/sync/status');
      logger.info('- TLV2 Status: http://localhost:' + PORT + '/api/mariadb/tlv2');
      logger.info('- TLV2 Sync: http://localhost:' + PORT + '/api/mariadb/tlv2/sync/status');
      logger.info('- Puente Status: http://localhost:' + PORT + '/api/mariadb/puente');
      logger.info('- Puente Sync: http://localhost:' + PORT + '/api/mariadb/puente/sync');
      
      // Configurar sincronización automática cada 30 segundos
      const SYNC_INTERVAL_SECONDS = 30;
      logger.info(`Configurando sincronización automática PLC-MariaDB cada ${SYNC_INTERVAL_SECONDS} segundos...`);
      tlv1MariaDBController.setupScheduledSync(SYNC_INTERVAL_SECONDS);
      tlv2MariaDBController.startAutoSync(SYNC_INTERVAL_SECONDS * 1000);
      puenteController.setupScheduledSync(SYNC_INTERVAL_SECONDS);
    });

    return { app, server };
  } catch (error) {
    logger.error('Error al iniciar el servidor con integración de MariaDB:', error);
    throw error;
  }
}

module.exports = {
  startMariaDBServer
};
