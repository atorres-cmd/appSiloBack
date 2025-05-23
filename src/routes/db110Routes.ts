// src/routes/db110Routes.ts
import express from 'express';
import { DB110Controller } from '../controllers/db110Controller';

/**
 * Crea las rutas para el controlador DB110
 * @param db110Controller - Instancia del controlador DB110
 * @returns Router de Express con las rutas configuradas
 */
const createDB110Routes = (db110Controller: DB110Controller) => {
  // Crear un router para las rutas del DB110
  const router = express.Router();

  // Definir las rutas para el DB110
  router.get('/values', db110Controller.getAllValues);
  router.post('/write', db110Controller.writeValue);

  return router;
};

export default createDB110Routes;
