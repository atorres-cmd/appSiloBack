const express = require('express');
const router = express.Router();
const { query } = require('../db/mariadb-config');
const tlv1MariaDBController = require('../controllers/tlv1MariaDBController');

// Obtener el estado actual del TLV1
router.get('/', async (req, res) => {
  try {
    const sql = 'SELECT * FROM TLV1_Status ORDER BY timestamp DESC LIMIT 1';
    const result = await query(sql);
    
    if (result.length > 0) {
      res.json(result[0]);
    } else {
      res.status(404).json({ message: 'No se encontraron datos para TLV1' });
    }
  } catch (error) {
    console.error('Error al obtener el estado actual de TLV1:', error);
    res.status(500).json({ error: 'Error al obtener datos de TLV1' });
  }
});

// Sincronizar manualmente los datos del PLC con la base de datos
router.post('/sync-manual', async (req, res) => {
  try {
    // Llamar al método de sincronización del controlador
    await tlv1MariaDBController.syncPLCToDatabase(req, res);
  } catch (error) {
    console.error('Error en la sincronización manual:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Error en la sincronización manual', 
      error: error.message 
    });
  }
});

// Obtener el historial de estados del TLV1
router.get('/historial', async (req, res) => {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 100;
    const results = await query('SELECT * FROM TLV1_Status ORDER BY timestamp DESC LIMIT ?', [limit]);
    res.json(results);
  } catch (error) {
    console.error('Error al obtener el historial del TLV1:', error);
    res.status(500).json({ error: 'Error al obtener el historial del TLV1' });
  }
});

// Actualizar el estado del TLV1
router.post('/', async (req, res) => {
  try {
    const { modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual } = req.body;
    
    const result = await query(
      'INSERT INTO TLV1_Status (modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual]
    );
    
    res.status(201).json({ 
      message: 'Estado del TLV1 actualizado correctamente',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error al actualizar el estado del TLV1:', error);
    res.status(500).json({ error: 'Error al actualizar el estado del TLV1' });
  }
});

module.exports = router;
