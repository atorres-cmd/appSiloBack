/**
 * Script para iniciar el backend con MariaDB portable
 * 
 * Este script inicia tanto el servidor MariaDB portable como el backend,
 * asegurando que la base de datos esté disponible antes de iniciar la aplicación.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');
const { setTimeout } = require('timers/promises');
const { execSync } = require('child_process');

// Importar el monitor de MariaDB y utilidades de puerto
const mariadbMonitor = require('./mariadb/monitor');
const portUtils = require('./mariadb/port-utils');

// Rutas importantes
const BACKEND_ROOT = __dirname;
const MARIADB_PATH = path.join(BACKEND_ROOT, 'mariadb');
const MARIADB_BIN_PATH = path.join(MARIADB_PATH, 'bin');
const MARIADB_DATA_PATH = path.join(MARIADB_PATH, 'data');

// Verificar si tenemos los binarios de MariaDB
function checkMariaDBBinaries() {
  const mysqldPath = path.join(MARIADB_BIN_PATH, 'mysqld.exe');
  
  if (!fs.existsSync(mysqldPath)) {
    console.error(`❌ No se encontró el binario de MariaDB en: ${mysqldPath}`);
    console.log('');
    console.log('Para que este script funcione, necesitas:');
    console.log('1. Copiar los archivos binarios de MariaDB portable a la carpeta:');
    console.log(`   ${MARIADB_BIN_PATH}`);
    console.log('2. Asegurarte de que el archivo mysqld.exe esté presente');
    console.log('');
    return false;
  }
  
  return true;
}

// Iniciar el servidor MariaDB
async function startMariaDBServer() {
  if (!checkMariaDBBinaries()) {
    return null;
  }
  
  console.log(`Ubicación de MariaDB: ${MARIADB_PATH}`);
  console.log(`Carpeta de datos: ${MARIADB_DATA_PATH}`);
  
  // Verificar si MariaDB ya está en ejecución
  const isRunning = await mariadbMonitor.isMariaDBRunning();
  if (isRunning) {
    console.log('MariaDB ya está en ejecución. Verificando conexión...');
    
    const canConnect = await mariadbMonitor.canConnectToMariaDB();
    if (canConnect) {
      console.log('✅ MariaDB ya está en ejecución y accesible');
      return { pid: 'existing' };
    } else {
      console.log('MariaDB está en ejecución pero no se puede conectar. Reiniciando...');
      await mariadbMonitor.stopMariaDB();
      // Esperar un momento para asegurarse de que se ha detenido completamente
      await setTimeout(2000);
    }
  }
  
  // Iniciar MariaDB usando el monitor
  const success = await mariadbMonitor.startMariaDB();
  
  if (success) {
    console.log('✅ MariaDB iniciado correctamente');
    return { pid: 'managed_by_monitor' };
  } else {
    console.error('❌ No se pudo iniciar MariaDB');
    return null;
  }
}

// Iniciar el backend
function startBackend() {
  console.log('Iniciando el backend...');
  
  // Ruta al script principal del backend
  const backendScript = path.join(BACKEND_ROOT, 'src', 'start-with-mariadb.js');
  
  // Configurar variables de entorno para el backend
  const env = Object.assign({}, process.env, {
    PORT: '3000', // Usar puerto 3000 para el backend
    DB_PORT: '3306' // Usar puerto 3306 para MariaDB
  });
  
  // Iniciar proceso
  const backendProcess = spawn('node', [backendScript], {
    stdio: 'inherit',
    detached: false,
    env: env // Pasar las variables de entorno configuradas
  });
  
  // Manejar eventos del proceso
  backendProcess.on('error', (err) => {
    console.error(`❌ Error al iniciar el backend: ${err.message}`);
  });
  
  backendProcess.on('exit', (code, signal) => {
    if (code !== 0) {
      console.log(`Backend se ha detenido con código: ${code}, señal: ${signal}`);
    } else {
      console.log('Backend se ha detenido correctamente');
    }
  });
  
  console.log(`✅ Backend iniciado con PID: ${backendProcess.pid}`);
  
  return backendProcess;
}

// Función principal para iniciar todo el sistema
async function startAll() {
  console.log('=== Iniciando Operator Insight con MariaDB Portable ===');
  
  // Verificar y liberar puertos necesarios
  console.log('Verificando puertos necesarios...');
  
  // Verificar puerto de MariaDB (3306)
  const mariadbPort = 3306;
  const mariadbPortStatus = await portUtils.isPortInUse(mariadbPort);
  if (mariadbPortStatus.inUse) {
    console.log(`Puerto ${mariadbPort} en uso por el proceso ${mariadbPortStatus.pid}. Liberando...`);
    await portUtils.freePort(mariadbPort);
  }
  
  // Verificar puerto del backend (3000)
  const backendPort = 3000;
  const backendPortStatus = await portUtils.isPortInUse(backendPort);
  if (backendPortStatus.inUse) {
    console.log(`Puerto ${backendPort} en uso por el proceso ${backendPortStatus.pid}. Liberando...`);
    await portUtils.freePort(backendPort);
  }
  
  // Verificar puerto del servidor MariaDB específico (3003)
  const mariadbServerPort = 3003;
  const mariadbServerPortStatus = await portUtils.isPortInUse(mariadbServerPort);
  if (mariadbServerPortStatus.inUse) {
    console.log(`Puerto ${mariadbServerPort} en uso por el proceso ${mariadbServerPortStatus.pid}. Liberando...`);
    await portUtils.freePort(mariadbServerPort);
  }
  
  // Iniciar MariaDB portable
  const mariadbProcess = await startMariaDBServer();
  if (!mariadbProcess) {
    console.error('❌ No se pudo iniciar MariaDB. Abortando.');
    process.exit(1);
  }
  
  // Iniciar el monitor de MariaDB para verificar periódicamente su estado
  const MONITOR_CHECK_INTERVAL = 30; // segundos
  console.log(`Iniciando monitor de MariaDB (intervalo: ${MONITOR_CHECK_INTERVAL} segundos)...`);
  const monitor = mariadbMonitor.startMonitor(MONITOR_CHECK_INTERVAL);
  
  // Esperar a que MariaDB esté listo
  console.log('Esperando a que MariaDB esté listo...');
  await setTimeout(2000);
  
  // Iniciar el backend
  console.log('Iniciando el backend...');
  const backendProcess = startBackend();
  if (!backendProcess) {
    console.error('❌ No se pudo iniciar el backend. Abortando.');
    process.exit(1);
  }
  
  console.log('=== Todos los servicios iniciados correctamente ===');
  console.log('Presiona Ctrl+C para detener todos los servicios');
  
  // Manejar la terminación del script
  process.on('SIGINT', async () => {
    console.log('\nDeteniendo servicios...');
    
    // Detener el monitor
    if (monitor && monitor.isRunning()) {
      monitor.stop();
      console.log('Monitor de MariaDB detenido');
    }
    
    // Detener el backend
    if (backendProcess && !backendProcess.killed) {
      backendProcess.kill();
      console.log('Backend detenido');
    }
    
    // Detener MariaDB
    await mariadbMonitor.stopMariaDB();
    console.log('MariaDB detenido');
    
    console.log('Todos los servicios detenidos correctamente');
    process.exit(0);
  });
}

// Iniciar todo
startAll().catch(err => {
  console.error('Error inesperado:', err);
  process.exit(1);
});
