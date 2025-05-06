const express = require('express');
const router = express.Router();
const { query } = require('../db/mariadb-config');
const tlv2MariaDBController = require('../controllers/tlv2MariaDBController');

// Obtener el último estado del TLV2
router.get('/', async (req, res) => {
  try {
    const sql = 'SELECT * FROM TLV2_Status ORDER BY timestamp DESC LIMIT 1';
    const result = await query(sql);
    res.json(result[0]);
  } catch (error) {
    console.error('Error al obtener el estado del TLV2:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener historial de estados del TLV2
router.get('/history', async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 10;
    const result = await tlv2MariaDBController.getHistoricalData(limit);
    res.json(result);
  } catch (error) {
    console.error('Error al obtener el historial del TLV2:', error);
    res.status(500).json({ error: error.message });
  }
});

// Sincronizar manualmente con el PLC
router.post('/sync', async (req, res) => {
  try {
    const result = await tlv2MariaDBController.syncPLCToDatabase();
    res.json(result);
  } catch (error) {
    console.error('Error al sincronizar con el PLC:', error);
    res.status(500).json({ error: error.message });
  }
});

// Obtener el estado de la sincronización automática
router.get('/sync/status', (req, res) => {
  try {
    const status = tlv2MariaDBController.getAutoSyncStatus();
    res.json(status);
  } catch (error) {
    console.error('Error al obtener el estado de la sincronización:', error);
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;