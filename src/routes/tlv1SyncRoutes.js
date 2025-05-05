// src/routes/tlv1SyncRoutes.js
const express = require('express');
const router = express.Router();
const tlv1MariaDBController = require('../controllers/tlv1MariaDBController');

// Ruta para sincronizar datos del PLC con la tabla TLV1_Status
router.post('/sync', tlv1MariaDBController.syncPLCToDatabase.bind(tlv1MariaDBController));

// Ruta para verificar el estado de la sincronización
router.get('/status', (req, res) => {
  res.json({
    success: true,
    message: 'El servicio de sincronización está activo'
  });
});

module.exports = router;
