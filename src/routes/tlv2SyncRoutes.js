const express = require('express');
const router = express.Router();
const tlv2MariaDBController = require('../controllers/tlv2MariaDBController');

// Ruta para sincronizar manualmente los datos del PLC con la base de datos
router.post('/sync', async (req, res) => {
  try {
    const result = await tlv2MariaDBController.syncPLCToDatabase();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Ruta para obtener el estado de la sincronización automática
router.get('/sync/status', (req, res) => {
  const status = tlv2MariaDBController.getAutoSyncStatus();
  res.json(status);
});

// Ruta para iniciar la sincronización automática
router.post('/sync/start', (req, res) => {
  const { intervalTime } = req.body;
  const result = tlv2MariaDBController.startAutoSync(intervalTime);
  res.json(result);
});

// Ruta para detener la sincronización automática
router.post('/sync/stop', (req, res) => {
  const result = tlv2MariaDBController.stopAutoSync();
  res.json(result);
});

module.exports = router;
