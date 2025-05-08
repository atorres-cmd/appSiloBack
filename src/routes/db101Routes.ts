// src/routes/db101Routes.ts
import { Router } from 'express';
import { DB101Controller } from '../controllers/db101Controller';

const createDB101Routes = (controller: DB101Controller) => {
  const router = Router();

  // Obtener todos los valores del DB101
  router.get('/', (req, res) => controller.getAllValues(req, res));

  // Leer un valor específico del DB101
  router.get('/read', (req, res) => controller.readValue(req, res));

  // Escribir un valor en el DB101
  router.post('/write', (req, res) => controller.writeValue(req, res));

  // Escribir todas las variables del DB101 de una vez
  router.post('/writeAll', (req, res) => controller.writeAllValues(req, res));

  return router;
};

export default createDB101Routes;
