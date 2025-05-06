// src/routes/ptRoutes.js
const express = require('express');
const ptController = require('../controllers/ptMariaDBController');

const router = express.Router();

// La inicialización de la tabla PT_Status se realiza automáticamente al cargar el controlador ptMariaDBController

/**
 * @route GET /api/pt
 * @description Obtiene el estado actual del Puente Transferidor (PT) desde MariaDB
 * @access Public
 */
router.get('/', ptController.getPTStatus.bind(ptController));

/**
 * @route POST /api/pt/sync
 * @description Sincroniza los datos del Puente Transferidor (PT) desde el PLC a MariaDB
 * @access Public
 */
router.post('/sync', ptController.syncPLCToDatabase.bind(ptController));

/**
 * @route GET /api/pt/plc
 * @description Obtiene los datos del Puente Transferidor (PT) directamente desde el PLC
 * @access Public
 */
router.get('/plc', async (req, res) => {
  try {
    // Leer datos directamente del PLC usando el nuevo controlador
    const plcData = await ptController.readPLCData();
    
    if (!plcData) {
      return res.status(500).json({
        success: false,
        message: 'No se pudieron leer los datos del PLC para el Puente Transferidor'
      });
    }
    
    // Convertir datos del PLC al formato adecuado
    const formattedData = ptController.convertPLCDataToDBFormat(plcData);
    
    res.json({
      success: true,
      data: formattedData
    });
  } catch (error) {
    console.error('Error al obtener datos del Puente Transferidor desde el PLC:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener datos del Puente Transferidor desde el PLC',
      error: error.message
    });
  }
});

module.exports = router;
