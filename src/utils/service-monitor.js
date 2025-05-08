/**
 * Módulo para supervisar y reiniciar automáticamente servicios
 * 
 * Este módulo proporciona funcionalidades para monitorear servicios HTTP
 * y reiniciarlos automáticamente si no están respondiendo.
 */

const http = require('http');
const { logger } = require('./logger');
const { startMariaDBServer } = require('./mariadb-server');

/**
 * Comprueba si un servicio HTTP está respondiendo
 * @param {string} host - Host del servicio
 * @param {number} port - Puerto del servicio
 * @param {string} path - Ruta para verificar (por defecto '/')
 * @param {number} timeout - Tiempo de espera en ms (por defecto 5000)
 * @returns {Promise<boolean>} - true si el servicio está respondiendo, false en caso contrario
 */
function checkServiceHealth(host, port, path = '/', timeout = 5000) {
  return new Promise((resolve) => {
    const options = {
      hostname: host,
      port: port,
      path: path,
      method: 'GET',
      timeout: timeout
    };

    const req = http.request(options, (res) => {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        resolve(true);
      } else {
        logger.warn(`Servicio en ${host}:${port}${path} respondió con código ${res.statusCode}`);
        resolve(false);
      }
    });

    req.on('error', (error) => {
      logger.error(`Error al verificar servicio en ${host}:${port}${path}:`, error.message);
      resolve(false);
    });

    req.on('timeout', () => {
      logger.warn(`Tiempo de espera agotado al verificar servicio en ${host}:${port}${path}`);
      req.destroy();
      resolve(false);
    });

    req.end();
  });
}

/**
 * Clase para supervisar y reiniciar automáticamente el servidor MariaDB
 */
class MariaDBMonitor {
  constructor() {
    this.isRunning = false;
    this.server = null;
    this.checkInterval = null;
    this.restartAttempts = 0;
    this.maxRestartAttempts = 5;
  }

  /**
   * Inicia el monitor del servidor MariaDB
   * @param {number} checkIntervalSeconds - Intervalo de verificación en segundos
   */
  start(checkIntervalSeconds = 60) {
    if (this.isRunning) {
      logger.info('Monitor de MariaDB ya está en ejecución');
      return;
    }

    this.isRunning = true;
    this.restartAttempts = 0;
    
    logger.info(`Iniciando monitor de MariaDB con intervalo de verificación de ${checkIntervalSeconds} segundos`);
    
    // Realizar verificación inicial
    this.checkAndRestartIfNeeded();
    
    // Configurar verificación periódica
    this.checkInterval = setInterval(() => {
      this.checkAndRestartIfNeeded();
    }, checkIntervalSeconds * 1000);
  }

  /**
   * Detiene el monitor del servidor MariaDB
   */
  stop() {
    if (!this.isRunning) {
      return;
    }

    logger.info('Deteniendo monitor de MariaDB');
    
    if (this.checkInterval) {
      clearInterval(this.checkInterval);
      this.checkInterval = null;
    }
    
    this.isRunning = false;
  }

  /**
   * Verifica si el servidor MariaDB está respondiendo y lo reinicia si es necesario
   */
  async checkAndRestartIfNeeded() {
    logger.info('Verificando estado del servidor MariaDB (Puerto 3003)...');
    
    const isHealthy = await checkServiceHealth('localhost', 3003, '/api/mariadb');
    
    if (isHealthy) {
      logger.info('Servidor MariaDB está funcionando correctamente');
      this.restartAttempts = 0;
      return;
    }
    
    logger.warn('Servidor MariaDB no está respondiendo, intentando reiniciar...');
    
    if (this.restartAttempts >= this.maxRestartAttempts) {
      logger.error(`Se alcanzó el número máximo de intentos de reinicio (${this.maxRestartAttempts})`);
      this.stop();
      return;
    }
    
    this.restartAttempts++;
    
    try {
      // Intentar iniciar el servidor MariaDB
      const { server } = await startMariaDBServer();
      this.server = server;
      logger.info(`Servidor MariaDB reiniciado correctamente (intento ${this.restartAttempts})`);
    } catch (error) {
      logger.error(`Error al reiniciar servidor MariaDB (intento ${this.restartAttempts}):`, error);
    }
  }
}

// Crear una instancia del monitor
const mariaDBMonitor = new MariaDBMonitor();

module.exports = {
  checkServiceHealth,
  mariaDBMonitor
};
