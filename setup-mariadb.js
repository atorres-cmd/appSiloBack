/**
 * Script para configurar MariaDB para Operator Insight
 * 
 * Este script verifica la instalación de MariaDB y configura la base de datos
 * para el proyecto Operator Insight.
 */

const { execSync } = require('child_process');
const { initializeDatabase } = require('./src/db/init-db');
const { testConnection } = require('./src/db/mariadb-config');
const readline = require('readline');
const path = require('path');
const fs = require('fs');

// Ruta a la instalación portable de MariaDB
const MARIADB_PATH = 'C:\\Users\\ASG\\Downloads\\mariadb-11.7.2-winx64';
const MYSQL_CLIENT = path.join(MARIADB_PATH, 'bin', 'mysql.exe');

// Crear interfaz de línea de comandos
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Función para preguntar al usuario
function pregunta(texto) {
  return new Promise((resolve) => {
    rl.question(texto, (respuesta) => {
      resolve(respuesta);
    });
  });
}

// Función para verificar si MariaDB está instalado
async function verificarMariaDB() {
  try {
    console.log('Verificando instalación de MariaDB...');
    
    // Verificar si existe la instalación portable de MariaDB
    if (fs.existsSync(MARIADB_PATH) && fs.existsSync(MYSQL_CLIENT)) {
      try {
        const version = execSync(`"${MYSQL_CLIENT}" --version`).toString();
        console.log(`MariaDB detectado: ${version}`);
        return true;
      } catch (error) {
        console.log('Error al ejecutar el cliente MySQL desde la instalación portable.');
        console.error(error);
      }
    }
    
    console.log('No se pudo detectar MariaDB en la ruta especificada.');
    console.log(`Ruta esperada: ${MARIADB_PATH}`);
    
    // Preguntar al usuario por la ruta de MariaDB
    const nuevaRuta = await pregunta('Introduzca la ruta completa a la carpeta de MariaDB: ');
    
    if (nuevaRuta && fs.existsSync(nuevaRuta)) {
      const mysqlPath = path.join(nuevaRuta, 'bin', 'mysql.exe');
      if (fs.existsSync(mysqlPath)) {
        try {
          const version = execSync(`"${mysqlPath}" --version`).toString();
          console.log(`MariaDB detectado en la nueva ruta: ${version}`);
          return true;
        } catch (error) {
          console.log('Error al ejecutar el cliente MySQL desde la nueva ruta.');
          console.error(error);
          return false;
        }
      } else {
        console.log('No se encontró el cliente MySQL en la ruta especificada.');
        return false;
      }
    } else {
      console.log('La ruta especificada no existe.');
      return false;
    }
  } catch (error) {
    console.error('Error al verificar MariaDB:', error);
    return false;
  }
}

// Función para verificar la conexión a MariaDB
async function verificarConexion() {
  try {
    console.log('Verificando conexión a MariaDB...');
    
    const conectado = await testConnection();
    
    if (conectado) {
      console.log('Conexión a MariaDB establecida correctamente.');
      return true;
    } else {
      console.log('No se pudo conectar a MariaDB.');
      
      // Solicitar credenciales al usuario
      console.log('Por favor, proporcione las credenciales de MariaDB:');
      const usuario = await pregunta('Usuario (por defecto "root"): ') || 'root';
      const password = await pregunta('Contraseña: ');
      
      // Actualizar el archivo .env con las nuevas credenciales
      try {
        const fs = require('fs');
        const path = require('path');
        const envPath = path.join(__dirname, '.env');
        
        let envContent = '';
        
        // Verificar si el archivo .env existe
        if (fs.existsSync(envPath)) {
          envContent = fs.readFileSync(envPath, 'utf8');
          
          // Actualizar las variables existentes
          envContent = envContent
            .replace(/DB_USER=.*/g, `DB_USER=${usuario}`)
            .replace(/DB_PASSWORD=.*/g, `DB_PASSWORD=${password}`);
        } else {
          // Crear un nuevo archivo .env
          envContent = `# Configuración de la base de datos MariaDB
DB_HOST=localhost
DB_PORT=3306
DB_NAME=operator_insight
DB_USER=${usuario}
DB_PASSWORD=${password}

# Puerto del servidor
PORT=3000

# Configuración del PLC (si es necesario)
PLC_IP=10.21.178.100
PLC_RACK=0
PLC_SLOT=3`;
        }
        
        // Guardar el archivo .env
        fs.writeFileSync(envPath, envContent);
        console.log('Archivo .env actualizado con las nuevas credenciales.');
        
        // Intentar conectar nuevamente
        return await testConnection();
      } catch (error) {
        console.error('Error al actualizar el archivo .env:', error);
        return false;
      }
    }
  } catch (error) {
    console.error('Error al verificar la conexión a MariaDB:', error);
    return false;
  }
}

// Función para inicializar la base de datos
async function inicializarBaseDatos() {
  try {
    console.log('Inicializando la base de datos...');
    
    const inicializado = await initializeDatabase();
    
    if (inicializado) {
      console.log('Base de datos inicializada correctamente.');
      return true;
    } else {
      console.log('No se pudo inicializar la base de datos.');
      return false;
    }
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    return false;
  }
}

// Función principal
async function main() {
  try {
    console.log('=== Configuración de MariaDB para Operator Insight ===');
    
    // Verificar si MariaDB está instalado
    const mariadbInstalado = await verificarMariaDB();
    if (!mariadbInstalado) {
      rl.close();
      return;
    }
    
    // Verificar la conexión a MariaDB
    const conexionEstablecida = await verificarConexion();
    if (!conexionEstablecida) {
      console.log('No se pudo establecer conexión a MariaDB. Por favor, verifique las credenciales e intente nuevamente.');
      rl.close();
      return;
    }
    
    // Inicializar la base de datos
    const baseDatosInicializada = await inicializarBaseDatos();
    if (!baseDatosInicializada) {
      console.log('No se pudo inicializar la base de datos. Por favor, verifique los logs para más información.');
      rl.close();
      return;
    }
    
    console.log('=== Configuración completada con éxito ===');
    console.log('Ahora puede iniciar el backend con la integración de MariaDB ejecutando:');
    console.log('node start-with-mariadb.js');
    
    rl.close();
  } catch (error) {
    console.error('Error durante la configuración:', error);
    rl.close();
  }
}

// Ejecutar la función principal
main();
