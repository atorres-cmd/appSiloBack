/**
 * Script para iniciar el backend con integración de MariaDB
 * 
 * Este script inicia la aplicación TypeScript con ts-node y luego
 * carga el módulo de integración de MariaDB.
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

// Verificar que ts-node esté instalado
try {
  require.resolve('ts-node');
} catch (e) {
  console.error('ts-node no está instalado. Ejecuta: npm install -g ts-node');
  process.exit(1);
}

// Verificar que el archivo app.ts exista
const appPath = path.join(__dirname, 'src', 'app.ts');
if (!fs.existsSync(appPath)) {
  console.error(`No se encontró el archivo ${appPath}`);
  process.exit(1);
}

console.log('Iniciando el backend con integración de MariaDB...');

// Iniciar la aplicación con ts-node
const tsNode = spawn('npx', ['ts-node', appPath], {
  stdio: 'inherit',
  env: { ...process.env, NODE_PATH: path.join(__dirname, 'node_modules') }
});

// Manejar la salida del proceso
tsNode.on('close', (code) => {
  if (code !== 0) {
    console.error(`El proceso ts-node terminó con código ${code}`);
  }
});

// Cargar el módulo de integración de MariaDB después de un breve retraso
setTimeout(() => {
  try {
    // Importar el módulo de integración
    const mariadbIntegrationPath = path.join(__dirname, 'src', 'mariadb-integration.js');
    const integrateMariaDB = require(mariadbIntegrationPath);
    
    // Importar la aplicación
    const appExportPath = path.join(__dirname, 'dist', 'app.js');
    const app = require(appExportPath).default;
    
    // Integrar MariaDB
    if (app && integrateMariaDB) {
      integrateMariaDB(app);
      console.log('Integración de MariaDB completada con éxito');
    } else {
      console.error('No se pudo integrar MariaDB: la aplicación o el módulo de integración no están disponibles');
    }
  } catch (error) {
    console.error('Error al cargar el módulo de integración de MariaDB:', error);
  }
}, 5000); // Esperar 5 segundos para que la aplicación se inicie completamente
