// src/routes/db101Routes.ts
import { Router } from 'express';
import { DB101Controller } from '../controllers/db101Controller';

const createDB101Routes = (controller: DB101Controller) => {
  const router = Router();

  // Obtener todos los valores del DB101
  router.get('/', controller.getAllValues);

  // Leer un valor específico del DB101
  router.get('/read', controller.readValue);

  // Escribir un valor en el DB101
  router.post('/write', controller.writeValue);

  // Escribir todas las variables del DB101 de una vez
  router.post('/writeAll', controller.writeAllValues);

  return router;
};

export default createDB101Routes;
