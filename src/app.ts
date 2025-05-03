// src/app.ts
import express, { Application } from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { logger } from './utils/logger';
import PLCService from './services/plcService';
import SimulationService from './services/simulationService';
import ComponentController from './controllers/componentController';
import { DB101Controller } from './controllers/db101Controller';
import createComponentRoutes from './routes/componentRoutes';
import createDB101Routes from './routes/db101Routes';
import createDataRoutes from './routes/dataRoutes';
import { plcConfig, plcVariables } from './config/plcConfig';
import { initializeDatabase, AppDataSource } from './config/database';
import 'reflect-metadata';
import { TLV1StorageService } from './services/tlv1StorageService';
import { DataStorageService } from './services/dataStorageService';

// Cargar variables de entorno
dotenv.config();

// Crear aplicación Express
const app: Application = express();
const server = http.createServer(app);

// Configurar CORS
const corsOptions = {
  origin: process.env.FRONTEND_URL || 'http://localhost:8080',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
};

// Configurar Socket.IO
const io = new Server(server, {
  cors: corsOptions
});

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Servir archivos estáticos desde la carpeta public
app.use(express.static(path.join(__dirname, 'public')));

// Ruta para servir las páginas HTML
app.get(['/', '/db101', '/dual-view', '/data-viewer', '/tlv1-viewer'], (req, res) => {
  const route = req.path === '/' ? '/index.html' : `${req.path}.html`;
  res.sendFile(path.join(__dirname, 'public', route));
});

// Siempre usar PLC real
const USE_SIMULATION = false;

// Interfaz común para los servicios de PLC
interface PLCServiceInterface {
  on(event: string, listener: (...args: any[]) => void): this;
  emit(event: string, ...args: any[]): boolean;
  connect?(): Promise<boolean>;
  disconnect?(): void;
  readAllItems?(): Promise<Record<string, any>>;
  writeItem?(address: string, value: any): boolean | Promise<boolean>;
  writePosition?(id: string, position: any): Promise<boolean>;
}

// Inicializar la base de datos y arrancar el servicio de almacenamiento TLV1
AppDataSource.initialize()
  .then(() => {
    logger.success('Base de datos SQLite inicializada correctamente');
    // Iniciar el servicio de almacenamiento de TLV1
    const tlv1Storage = new TLV1StorageService(AppDataSource);
    tlv1Storage.start(60000); // cada 1 minuto
    logger.info('Servicio de almacenamiento de datos TLV1 iniciado');
    // Montar el router de dataRoutes con DataStorageService
    const dataStorageService = new DataStorageService(AppDataSource);
    app.use('/api/data', createDataRoutes(dataStorageService));
  })
  .catch(err => {
    logger.error('Error al inicializar la base de datos SQLite:', err);
  });

// Inicializar servicio (siempre PLC real)
let service: PLCServiceInterface;

logger.info('Iniciando conexión con PLC Siemens S7-400 real');
service = new PLCService(plcConfig, plcVariables);
if (service.connect) {
  service.connect()
    .then(() => logger.success('PLC Siemens S7-400 conectado correctamente'))
    .catch(err => {
      logger.error('Error al conectar con el PLC Siemens S7-400:', err);
      logger.warn('No se pudo conectar con el PLC real. Asegúrese de que el PLC esté encendido y accesible.');
    });
}

// Crear controladores y rutas
const componentController = new ComponentController(service);
const db101Controller = new DB101Controller(service);

app.use('/api/components', createComponentRoutes(componentController));
app.use('/api/plc/db101', createDB101Routes(db101Controller));

// Ruta de estado
app.get('/api/status', (req, res) => {
  res.json({
    status: 'online',
    mode: USE_SIMULATION ? 'simulation' : 'plc',
    timestamp: new Date().toISOString()
  });
});

// Socket.IO para comunicación en tiempo real
io.on('connection', (socket) => {
  logger.info(`Cliente conectado: ${socket.id}`);
  
  // Enviar datos iniciales al cliente
  // Enviar datos de TLV1
  componentController.formatTLV1Data()
    .then(initialData => {
      socket.emit('components', initialData);
      socket.emit('tlv1-data', initialData);
    })
    .catch(error => {
      logger.error('Error al enviar datos iniciales de TLV1:', error);
    });
    
  // Manejar actualización de posición desde el cliente
  socket.on('updatePosition', async (data) => {
    try {
      let success = false;
      
      if (data.id === 'tlv1' && service.writePosition) {
        success = await service.writePosition(data.id, data.position);
      }
      
      if (success) {
        logger.info(`Posición actualizada para ${data.id}: ${JSON.stringify(data.position)}`);
        // Emitir los datos actualizados a todos los clientes
        if (data.id === 'tlv1') {
          const updatedData = await componentController.formatTLV1Data();
          io.emit('components', updatedData ?? {});
          io.emit('tlv1-data', updatedData ?? {});
        }
      }
    } catch (error) {
      logger.error('Error al actualizar posición:', error);
      socket.emit('error', 'Error al actualizar posición');
    }
  });
  
  // Manejar creación de órdenes desde el cliente
  socket.on('createOrder', async (orderData: any) => {
    try {
      if (orderData.id === 'tlv1') {
        // Crear orden para TLV1
        if (service.writeItem) {
          await service.writeItem('DB101.DBB20', orderData.type); // Tipo de orden
          
          // Origen
          await service.writeItem('DB101.DBB22', orderData.origin.pasillo);
          await service.writeItem('DB101.DBB23', orderData.origin.x);
          await service.writeItem('DB101.DBB24', orderData.origin.y);
          await service.writeItem('DB101.DBB25', orderData.origin.z);
          
          // Destino
          await service.writeItem('DB101.DBB27', orderData.destination.pasillo);
          await service.writeItem('DB101.DBB28', orderData.destination.x);
          await service.writeItem('DB101.DBB29', orderData.destination.y);
          await service.writeItem('DB101.DBB30', orderData.destination.z);
          
          // Emitir los datos actualizados a todos los clientes
          const updatedData = await componentController.formatTLV1Data();
          io.emit('components', updatedData ?? {});
          io.emit('tlv1-data', updatedData ?? {});
          
          logger.info(`Orden creada para TLV1: ${JSON.stringify(orderData)}`);
        }
      }
    } catch (error) {
      logger.error('Error al crear orden:', error);
      socket.emit('error', 'Error al crear orden');
    }
  });
  
  // Manejar solicitud de datos específicos
  socket.on('requestData', (data) => {
    try {
      if (!data.id || data.id === 'tlv1') {
        componentController.formatTLV1Data()
          .then(tlv1Data => {
            socket.emit('tlv1-data', tlv1Data);
          })
          .catch(error => {
            logger.error('Error al obtener datos de TLV1:', error);
            socket.emit('error', 'Error al obtener datos de TLV1');
          });
      }
    } catch (error) {
      logger.error('Error al procesar solicitud de datos:', error);
      socket.emit('error', 'Error al procesar solicitud de datos');
    }
  });
  
  socket.on('disconnect', () => {
    logger.info(`Cliente desconectado: ${socket.id}`);
  });
});

// Suscribirse a los eventos de datos
service.on('data', (components) => {
  // Emitir los datos a todos los clientes conectados
  io.emit('components', components ?? {});
});

// Configurar puerto
const PORT = process.env.PORT || 3001;

// Iniciar servidor
server.listen(PORT, () => {
  logger.info(`Servidor escuchando en el puerto ${PORT}`);
});

export default app;
