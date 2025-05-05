const express = require('express');
const { initializeDatabase } = require('./db/init-db');
const componentRoutes = require('./routes/componentRoutes');
const alarmRoutes = require('./routes/alarmRoutes');
const { testConnection } = require('./db/mariadb-config');

/**
 * Función para integrar las rutas de MariaDB en la aplicación Express existente
 * @param {express.Application} app - La aplicación Express
 */
function integrateMariaDB(app) {
  logger.info('Iniciando integración de MariaDB...');
  
  // Inicializar la base de datos MariaDB
  initializeDatabase()
    .then(success => {
      if (success) {
        logger.success('Base de datos MariaDB inicializada correctamente');
        
        // Montar las rutas de la API en un prefijo separado para no interferir con las rutas existentes
        app.use('/api/mariadb/components', componentRoutes);
        app.use('/api/mariadb/alarms', alarmRoutes);
        
        // Ruta para verificar el estado de la conexión a MariaDB
        app.get('/api/mariadb/status', async (req, res) => {
          try {
            const connected = await testConnection();
            res.json({
              status: connected ? 'connected' : 'disconnected',
              database: 'MariaDB',
              timestamp: new Date().toISOString()
            });
          } catch (error) {
            res.status(500).json({
              status: 'error',
              message: error.message,
              timestamp: new Date().toISOString()
            });
          }
        });
        
        // Ruta de información para documentar las rutas disponibles
        app.get('/api/mariadb', (req, res) => {
          res.json({
            message: 'API de MariaDB para Operator Insight',
            endpoints: [
              { method: 'GET', path: '/api/mariadb/status', description: 'Estado de la conexión a MariaDB' },
              { method: 'GET', path: '/api/mariadb/components', description: 'Obtener todos los componentes' },
              { method: 'GET', path: '/api/mariadb/components/:id', description: 'Obtener un componente por ID' },
              { method: 'GET', path: '/api/mariadb/components/type/:type', description: 'Obtener componentes por tipo' },
              { method: 'GET', path: '/api/mariadb/alarms', description: 'Obtener todas las alarmas' },
              { method: 'GET', path: '/api/mariadb/alarms/component/:componentId', description: 'Obtener alarmas por componente' },
              { method: 'GET', path: '/api/mariadb/alarms/type/:type', description: 'Obtener alarmas por tipo' }
            ],
            note: 'Esta API es complementaria y no interfiere con la API existente del PLC'
          });
        });
        
        logger.success('Rutas de MariaDB integradas correctamente');
        logger.info('Accede a la documentación en: /api/mariadb');
      } else {
        logger.error('No se pudo inicializar la base de datos MariaDB');
      }
    })
    .catch(error => {
      logger.error('Error al inicializar la base de datos MariaDB:', error);
    });
}

module.exports = integrateMariaDB;
