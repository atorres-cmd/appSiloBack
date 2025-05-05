const express = require('express');
const router = express.Router();
const { 
  getAllComponents, 
  getComponentById, 
  getComponentsByType, 
  updateComponent 
} = require('../db/queries');

// Obtener todos los componentes
router.get('/', async (req, res) => {
  try {
    const components = await getAllComponents();
    res.json(components);
  } catch (error) {
    console.error('Error en la ruta GET /components:', error);
    res.status(500).json({ error: 'Error al obtener los componentes' });
  }
});

// Obtener un componente por ID
router.get('/:id', async (req, res) => {
  try {
    const component = await getComponentById(req.params.id);
    
    if (!component) {
      return res.status(404).json({ error: 'Componente no encontrado' });
    }
    
    res.json(component);
  } catch (error) {
    console.error(`Error en la ruta GET /components/${req.params.id}:`, error);
    res.status(500).json({ error: 'Error al obtener el componente' });
  }
});

// Obtener componentes por tipo
router.get('/type/:type', async (req, res) => {
  try {
    const components = await getComponentsByType(req.params.type);
    res.json(components);
  } catch (error) {
    console.error(`Error en la ruta GET /components/type/${req.params.type}:`, error);
    res.status(500).json({ error: 'Error al obtener los componentes por tipo' });
  }
});

// Actualizar un componente
router.put('/:id', async (req, res) => {
  try {
    const success = await updateComponent(req.params.id, req.body);
    
    if (!success) {
      return res.status(404).json({ error: 'Componente no encontrado o no se pudo actualizar' });
    }
    
    const updatedComponent = await getComponentById(req.params.id);
    res.json(updatedComponent);
  } catch (error) {
    console.error(`Error en la ruta PUT /components/${req.params.id}:`, error);
    res.status(500).json({ error: 'Error al actualizar el componente' });
  }
});

module.exports = router;
