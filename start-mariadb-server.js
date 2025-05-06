/**
 * Script para iniciar el servidor con integración de MariaDB
 * 
 * Este script inicia un servidor Express con la integración de MariaDB
 * en el puerto 3001 para evitar conflictos con otros servidores.
 */

// Importar módulos necesarios
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./src/db/init-db');
const tlv1Routes = require('./src/routes/tlv1Routes');
const tlv1SyncRoutes = require('./src/routes/tlv1SyncRoutes');
const tlv1MariaDBController = require('./src/controllers/tlv1MariaDBController');
const tlv2Routes = require('./src/routes/tlv2Routes');
const tlv2SyncRoutes = require('./src/routes/tlv2SyncRoutes');
const tlv2MariaDBController = require('./src/controllers/tlv2MariaDBController');
const puenteRoutes = require('./src/routes/ptRoutes');
const puenteController = require('./src/controllers/ptMariaDBController');

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

// Iniciar el servidor
async function startServer() {
  try {
    // Inicializar la base de datos
    console.log('Inicializando la base de datos MariaDB...');
    await initializeDatabase();
    
    // Definir un puerto específico (3003) para evitar conflictos
    const PORT = 3003;
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`Servidor con integración de MariaDB iniciado en el puerto ${PORT}`);
      console.log('Rutas disponibles:');
      console.log('- Documentación API: http://localhost:' + PORT + '/api/mariadb');
      console.log('- TLV1 Status: http://localhost:' + PORT + '/api/mariadb/tlv1');
      console.log('- TLV1 Sync: http://localhost:' + PORT + '/api/mariadb/tlv1/sync/status');
      console.log('- TLV2 Status: http://localhost:' + PORT + '/api/mariadb/tlv2');
      console.log('- TLV2 Sync: http://localhost:' + PORT + '/api/mariadb/tlv2/sync/status');
      console.log('- Puente Status: http://localhost:' + PORT + '/api/mariadb/puente');
      console.log('- Puente Sync: http://localhost:' + PORT + '/api/mariadb/puente/sync');
      
      // Configurar sincronización automática cada 30 segundos
      const SYNC_INTERVAL_SECONDS = 30;
      console.log(`Configurando sincronización automática PLC-MariaDB cada ${SYNC_INTERVAL_SECONDS} segundos...`);
      tlv1MariaDBController.setupScheduledSync(SYNC_INTERVAL_SECONDS);
      tlv2MariaDBController.startAutoSync(SYNC_INTERVAL_SECONDS * 1000);
      puenteController.setupScheduledSync(SYNC_INTERVAL_SECONDS);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor con integración de MariaDB:', error);
  }
}

// Ejecutar la función para iniciar el servidor
startServer();
