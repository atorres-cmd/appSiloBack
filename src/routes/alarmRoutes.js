const express = require('express');
const router = express.Router();
const { 
  getAllAlarms, 
  getAlarmsByComponentId, 
  getAlarmsByType, 
  createAlarm, 
  resolveAlarm 
} = require('../db/queries');

// Obtener todas las alarmas
router.get('/', async (req, res) => {
  try {
    const alarms = await getAllAlarms();
    res.json(alarms);
  } catch (error) {
    console.error('Error en la ruta GET /alarms:', error);
    res.status(500).json({ error: 'Error al obtener las alarmas' });
  }
});

// Obtener alarmas por componente
router.get('/component/:componentId', async (req, res) => {
  try {
    const alarms = await getAlarmsByComponentId(req.params.componentId);
    res.json(alarms);
  } catch (error) {
    console.error(`Error en la ruta GET /alarms/component/${req.params.componentId}:`, error);
    res.status(500).json({ error: 'Error al obtener las alarmas del componente' });
  }
});

// Obtener alarmas por tipo
router.get('/type/:type', async (req, res) => {
  try {
    const alarms = await getAlarmsByType(req.params.type);
    res.json(alarms);
  } catch (error) {
    console.error(`Error en la ruta GET /alarms/type/${req.params.type}:`, error);
    res.status(500).json({ error: 'Error al obtener las alarmas por tipo' });
  }
});

// Crear una nueva alarma
router.post('/', async (req, res) => {
  try {
    const alarmId = await createAlarm(req.body);
    res.status(201).json({ id: alarmId, message: 'Alarma creada correctamente' });
  } catch (error) {
    console.error('Error en la ruta POST /alarms:', error);
    res.status(500).json({ error: 'Error al crear la alarma' });
  }
});

// Marcar una alarma como resuelta
router.put('/:id/resolve', async (req, res) => {
  try {
    const { resolvedBy } = req.body;
    
    if (!resolvedBy) {
      return res.status(400).json({ error: 'Se requiere el campo resolvedBy' });
    }
    
    const success = await resolveAlarm(req.params.id, resolvedBy);
    
    if (!success) {
      return res.status(404).json({ error: 'Alarma no encontrada o no se pudo actualizar' });
    }
    
    res.json({ message: 'Alarma marcada como resuelta correctamente' });
  } catch (error) {
    console.error(`Error en la ruta PUT /alarms/${req.params.id}/resolve:`, error);
    res.status(500).json({ error: 'Error al marcar la alarma como resuelta' });
  }
});

module.exports = router;
