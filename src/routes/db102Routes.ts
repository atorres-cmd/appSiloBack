// src/routes/db102Routes.ts
import express from 'express';
import { DB102Controller } from '../controllers/db102Controller';

// Crear un servicio mock para el PLC
const mockPLCService = {
  readAllItems: async () => {
    return {
      'DB102,B0': 1,  // modo
      'DB102,B1': 0,  // ocupacion
      'DB102,B2': 0,  // averia
      'DB102,W10': 45, // x_actual
      'DB102,W12': 12, // y_actual
      'DB102,W14': 3,  // z_actual
      'DB102,B18': 5,  // pasillo_actual
      'DB102,W32': 2005, // matricula - dirección correcta
      'DB102,B40': 1,  // estado_fin_orden
      'DB102,B41': 0   // resultado_fin_orden
    };
  },
  writeItem: async (address: string, value: any) => {
    console.log(`Mock: Escribiendo ${value} en ${address}`);
    return true;
  }
};

// Crear instancia del controlador con el servicio mock
const db102Controller = new DB102Controller(mockPLCService);

// Crear router
const router = express.Router();

// Definir rutas
router.get('/', db102Controller.getAllValues);
router.post('/write', db102Controller.writeValue);

export default router;