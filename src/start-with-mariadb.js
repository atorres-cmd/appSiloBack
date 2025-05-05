/**
 * Script para iniciar el backend con integración de MariaDB
 * 
 * Este script inicia el servidor con la integración de MariaDB
 * sin interferir con la comunicación existente del PLC.
 */

// Importar módulos necesarios
const express = require('express');
const cors = require('cors');
const { initializeDatabase } = require('./db/init-db');
const componentRoutes = require('./routes/componentRoutes');
const alarmRoutes = require('./routes/alarmRoutes');

// Crear una instancia de Express
const app = express();

// Configurar middleware
app.use(cors());
app.use(express.json());

// Configurar rutas para MariaDB
app.use('/api/mariadb/components', componentRoutes);
app.use('/api/mariadb/alarms', alarmRoutes);

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
    
    // Definir el puerto (usando 3001 para evitar conflictos)
    const PORT = process.env.PORT || 3001;
    
    // Iniciar el servidor
    app.listen(PORT, () => {
      console.log(`Servidor con integración de MariaDB iniciado en el puerto ${PORT}`);
      console.log('Rutas disponibles:');
      console.log('- Documentación API: http://localhost:' + PORT + '/api/mariadb');
      console.log('- Componentes: http://localhost:' + PORT + '/api/mariadb/components');
      console.log('- Alarmas: http://localhost:' + PORT + '/api/mariadb/alarms');
    });
  } catch (error) {
    console.error('Error al iniciar el servidor con integración de MariaDB:', error);
  }
}

// Ejecutar la función para iniciar el servidor
startServer();
