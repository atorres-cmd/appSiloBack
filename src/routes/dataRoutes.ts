// src/routes/dataRoutes.ts
import { Router } from 'express';
import { DataStorageService } from '../services/dataStorageService';

const createDataRoutes = (dataStorageService: DataStorageService) => {
  const router = Router();

  // Obtener el registro actual de TLV1
  router.get('/tlv1', async (req, res) => {
    try {
      const records = await dataStorageService.getLatestTLV1Records();
      res.json({
        success: true,
        count: records.length,
        data: records
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Error al obtener registro de TLV1',
        error: (error as Error).message
      });
    }
  });

  return router;
};

export default createDataRoutes;
