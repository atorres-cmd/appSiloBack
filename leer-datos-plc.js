// Script para leer los datos actuales del PLC (DB110 - Puente Transferidor)
const ptController = require('./src/controllers/ptMariaDBController');
const { logger } = require('./src/utils/logger');

async function leerDatosPLC() {
  try {
    console.log('Intentando leer datos actuales del PLC para el Puente Transferidor (DB110)...');
    
    // Leer datos del PLC utilizando el controlador existente
    const plcData = await ptController.readPLCData();
    
    if (!plcData) {
      console.error('No se pudieron leer datos del PLC. Verifica la conexión y los parámetros.');
      return;
    }
    
    // Mostrar los datos crudos del PLC
    console.log('\n=== DATOS CRUDOS DEL PLC (DB110) ===');
    console.log(JSON.stringify(plcData, null, 2));
    
    // Convertir a formato legible
    const formattedData = ptController.convertPLCDataToDBFormat(plcData);
    
    // Mostrar los datos formateados
    console.log('\n=== DATOS FORMATEADOS ===');
    console.log('Ocupación:', formattedData.ocupacion, getOcupacionText(formattedData.ocupacion));
    console.log('Estado:', formattedData.estado, getEstadoText(formattedData.estado));
    console.log('Situación:', formattedData.situacion, getSituacionText(formattedData.situacion));
    console.log('Posición:', formattedData.posicion);
    
    console.log('\nLectura completada con éxito.');
  } catch (error) {
    console.error('Error al leer datos del PLC:', error);
  }
}

// Funciones auxiliares para mostrar textos descriptivos
function getOcupacionText(ocupacion) {
  switch (ocupacion) {
    case 0: return '(LIBRE)';
    case 1: return '(OCUPADO)';
    default: return '(DESCONOCIDO)';
  }
}

function getEstadoText(estado) {
  switch (estado) {
    case 0: return '(OK)';
    case 1: return '(AVERÍA)';
    default: return '(DESCONOCIDO)';
  }
}

function getSituacionText(situacion) {
  switch (situacion) {
    case 0: return '(PARADO)';
    case 1: return '(EN MOVIMIENTO)';
    default: return '(DESCONOCIDO)';
  }
}

// Ejecutar la función principal
leerDatosPLC();
