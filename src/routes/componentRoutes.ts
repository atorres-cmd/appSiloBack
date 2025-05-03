// src/routes/componentRoutes.ts
import { Router } from 'express';
import ComponentController from '../controllers/componentController';

const createComponentRoutes = (controller: ComponentController) => {
  const router = Router();

  // Rutas para los componentes
  router.get('/', controller.getComponents);
  router.post('/:id/position', controller.updatePosition);

  return router;
};

export default createComponentRoutes;
