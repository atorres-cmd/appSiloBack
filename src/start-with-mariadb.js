/**
 * Script para iniciar el backend con integración de MariaDB
 * 
 * Este script inicia el servidor con la integración de MariaDB
 * sin interferir con la comunicación existente del PLC.
 * Además, inicia automáticamente el servidor MariaDB específico en el puerto 3003.
 */

// Importar módulos necesarios
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./db/init-db');
const componentRoutes = require('./routes/componentRoutes');
const alarmRoutes = require('./routes/alarmRoutes');

// Importar rutas específicas para TLV1, TLV2 y PT
const tlv1Routes = require('./routes/tlv1Routes');
const tlv2Routes = require('./routes/tlv2Routes');
const ptRoutes = require('./routes/ptRoutes');

// Importar controladores para TLV1, TLV2 y PT
const tlv1Controller = require('./controllers/tlv1MariaDBController');
const tlv2Controller = require('./controllers/tlv2MariaDBController');
const ptController = require('./controllers/ptMariaDBController');

// Importar el módulo para iniciar el servidor MariaDB específico
const { startMariaDBServer } = require('./utils/mariadb-server');

// Importar el módulo de supervisión de servicios
const { mariaDBMonitor } = require('./utils/service-monitor');

// Crear una instancia de Express
const app = express();

// Configurar middleware
app.use(cors());
app.use(express.json());

// Configurar rutas para MariaDB
app.use('/api/mariadb/components', componentRoutes);
app.use('/api/mariadb/alarms', alarmRoutes);

// Configurar rutas específicas para TLV1, TLV2 y PT
app.use('/api/tlv1', tlv1Routes);
app.use('/api/tlv2', tlv2Routes);
app.use('/api/pt', ptRoutes);

// Ruta de documentación
app.get('/api/mariadb', (req, res) => {
  res.json({
    message: 'API de MariaDB para Operator Insight',
    endpoints: {
      components: {
        getAll: 'GET /api/mariadb/components',
        getById: 'GET /api/mariadb/components/:id',
        create: 'POST /api/mariadb/components',
        update: 'PUT /api/mariadb/components/:id',
        delete: 'DELETE /api/mariadb/components/:id'
      },
      alarms: {
        getAll: 'GET /api/mariadb/alarms',
        getById: 'GET /api/mariadb/alarms/:id',
        getByComponent: 'GET /api/mariadb/alarms/component/:componentId',
        create: 'POST /api/mariadb/alarms',
        update: 'PUT /api/mariadb/alarms/:id',
        delete: 'DELETE /api/mariadb/alarms/:id'
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
    
    // Configurar sincronización automática para TLV1, TLV2 y PT
    console.log('Configurando sincronización automática para TLV1, TLV2 y PT...');
    
    // Configurar sincronización para TLV1 (cada 30 segundos)
    tlv1Controller.setupScheduledSync(30);
    
    // Configurar sincronización para TLV2 (cada 30 segundos)
    tlv2Controller.startAutoSync();
    
    // PT ya tiene configurada la sincronización automática en su propio archivo
    
    // Definir el puerto (usando 3000 para mantener compatibilidad)
    const PORT = process.env.PORT || 3000;
    
    // Iniciar el servidor principal
    app.listen(PORT, () => {
      console.log(`Servidor principal iniciado en el puerto ${PORT}`);
      console.log('Rutas disponibles:');
      console.log('- Documentación API: http://localhost:' + PORT + '/api/mariadb');
      console.log('- Componentes: http://localhost:' + PORT + '/api/mariadb/components');
      console.log('- Alarmas: http://localhost:' + PORT + '/api/mariadb/alarms');
      
      // Iniciar automáticamente el servidor MariaDB específico
      console.log('Iniciando automáticamente el servidor MariaDB específico (Puerto 3003)...');
      startMariaDBServer()
        .then(({ server }) => {
          console.log('Servidor MariaDB específico iniciado correctamente en el puerto 3003');
          
          // Iniciar el monitor del servicio MariaDB (verificar cada 30 segundos)
          console.log('Iniciando monitor de supervisión para el servidor MariaDB...');
          mariaDBMonitor.start(30);
          console.log('Monitor de supervisión iniciado correctamente (intervalo: 30 segundos)');
        })
        .catch(error => {
          console.error('Error al iniciar el servidor MariaDB específico:', error);
          
          // Aún así, iniciar el monitor para que intente recuperar el servicio
          console.log('Iniciando monitor de supervisión para intentar recuperar el servidor MariaDB...');
          mariaDBMonitor.start(15); // Intervalo más corto para recuperación inicial
        });
    });
  } catch (error) {
    console.error('Error al iniciar el servidor con integración de MariaDB:', error);
  }
}

// Ejecutar la función para iniciar el servidor
startServer();
