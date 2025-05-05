// src/utils/logger.js
/**
 * Módulo de registro simple para la aplicación
 */
const logger = {
  info: (message, ...args) => {
    console.log(`[INFO] ${message}`, ...args);
  },
  
  warn: (message, ...args) => {
    console.warn(`[WARN] ${message}`, ...args);
  },
  
  error: (message, ...args) => {
    console.error(`[ERROR] ${message}`, ...args);
  },
  
  debug: (message, ...args) => {
    if (process.env.DEBUG) {
      console.debug(`[DEBUG] ${message}`, ...args);
    }
  }
};

module.exports = { logger };
