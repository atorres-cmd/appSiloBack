// src/controllers/db102Controller.ts
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

// Importar nodes7 de forma dinámica para evitar problemas de tipado
const nodes7 = require('nodes7');

// Interfaz para el servicio PLC
interface PLCServiceInterface {
  readAllItems?(): Promise<Record<string, any>>;
  writeItem?(address: string, value: any): Promise<boolean> | boolean;
}

export class DB102Controller {
  private service: PLCServiceInterface;

  constructor(service: PLCServiceInterface) {
    this.service = service;
  }

  // Obtener todos los valores del DB102
  public getAllValues = async (req: Request, res: Response): Promise<void> => {
    try {
      // Forzar la lectura directa de valores del PLC real
      const conn = new nodes7();

      // Configuración de conexión al PLC
      const connectionParams = {
        host: process.env.PLC_IP || '10.21.178.100',
        port: 102,
        rack: parseInt(process.env.PLC_RACK || '0'),
        slot: parseInt(process.env.PLC_SLOT || '3'),
        timeout: 5000
      };

      // Intentar leer valores reales del PLC
      try {
        // Crear una promesa para manejar la conexión asíncrona
        const plcValues = await new Promise<Record<string, any>>((resolve, reject) => {
          // Conectar al PLC
          conn.initiateConnection(connectionParams, (err: any) => {
            if (err) {
              logger.error('Error al conectar con el PLC:', err);
              reject(err);
              return;
            }

            // Añadir variables para leer (DB102 en lugar de DB101)
            conn.addItems(['DB102,B0', 'DB102,B1', 'DB102,B2', 'DB102,W10', 'DB102,W12', 'DB102,W14', 'DB102,B18', 'DB102,B20', 'DB102,B22', 'DB102,B23', 'DB102,B24', 'DB102,B25', 'DB102,B27', 'DB102,B28', 'DB102,B29', 'DB102,B30', 'DB102,W32', 'DB102,B40', 'DB102,B41', 'DB102,B42', 'DB102,B43', 'DB102,B44', 'DB102,B45']);

            // Leer todas las variables
            conn.readAllItems((errRead: any, values: Record<string, any>) => {
              if (errRead) {
                logger.error('Error al leer valores del PLC:', errRead);
                reject(errRead);
                return;
              }

              // Desconectar después de leer
              conn.dropConnection(() => {
                logger.info('Conexión con el PLC cerrada correctamente');
              });

              // Resolver con los valores leídos
              resolve(values);
            });
          });
        });

        // Mapear los valores a un formato más amigable
        const mappedValues = {
          modo: plcValues['DB102,B0'] !== undefined ? plcValues['DB102,B0'] : 0,
          ocupacion: plcValues['DB102,B1'] !== undefined ? plcValues['DB102,B1'] : 0,
          averia: plcValues['DB102,B2'] !== undefined ? plcValues['DB102,B2'] : 0,
          x_actual: plcValues['DB102,W10'] !== undefined ? plcValues['DB102,W10'] : 0,
          y_actual: plcValues['DB102,W12'] !== undefined ? plcValues['DB102,W12'] : 0,
          z_actual: plcValues['DB102,W14'] !== undefined ? plcValues['DB102,W14'] : 0,
          pasillo_actual: plcValues['DB102,B18'] !== undefined ? plcValues['DB102,B18'] : 0,
          matricula: plcValues['DB102,W32'] !== undefined ? plcValues['DB102,W32'] : 0,
          estado_fin_orden: plcValues['DB102,B40'] !== undefined ? plcValues['DB102,B40'] : 0,
          resultado_fin_orden: plcValues['DB102,B41'] !== undefined ? plcValues['DB102,B41'] : 0
        };

        // Responder con los valores mapeados
        res.status(200).json({
          success: true,
          data: mappedValues,
          raw: plcValues
        });
      } catch (plcError) {
        logger.error('Error al leer del PLC real:', plcError);
        
        // Si hay un error con el PLC real, intentar usar el servicio mock
        if (this.service.readAllItems) {
          const mockValues = await this.service.readAllItems();
          
          // Mapear los valores del mock
          const mappedMockValues = {
            modo: mockValues['DB102,B0'] !== undefined ? mockValues['DB102,B0'] : 0,
            ocupacion: mockValues['DB102,B1'] !== undefined ? mockValues['DB102,B1'] : 0,
            averia: mockValues['DB102,B2'] !== undefined ? mockValues['DB102,B2'] : 0,
            x_actual: mockValues['DB102,W10'] !== undefined ? mockValues['DB102,W10'] : 0,
            y_actual: mockValues['DB102,W12'] !== undefined ? mockValues['DB102,W12'] : 0,
            z_actual: mockValues['DB102,W14'] !== undefined ? mockValues['DB102,W14'] : 0,
            pasillo_actual: mockValues['DB102,B18'] !== undefined ? mockValues['DB102,B18'] : 0,
            matricula: mockValues['DB102,W32'] !== undefined ? mockValues['DB102,W32'] : 0,
            estado_fin_orden: mockValues['DB102,B40'] !== undefined ? mockValues['DB102,B40'] : 0,
            resultado_fin_orden: mockValues['DB102,B41'] !== undefined ? mockValues['DB102,B41'] : 0
          };
          
          // Responder con los valores del mock
          res.status(200).json({
            success: true,
            data: mappedMockValues,
            source: 'mock',
            raw: mockValues
          });
        } else {
          throw plcError;
        }
      }
    } catch (error: any) {
      logger.error('Error al obtener valores del DB102:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al obtener valores del DB102'
      });
    }
  };

  // Escribir un valor en el DB102
  public writeValue = async (req: Request, res: Response): Promise<void> => {
    try {
      const { address, value } = req.body;

      if (!address || value === undefined) {
        res.status(400).json({
          success: false,
          error: 'Se requiere dirección y valor'
        });
        return;
      }

      // Validar que la dirección comience con DB102
      if (!address.startsWith('DB102')) {
        res.status(400).json({
          success: false,
          error: 'La dirección debe comenzar con DB102'
        });
        return;
      }

      // Forzar la escritura directa en el PLC real
      const conn = new nodes7();

      // Configuración de conexión al PLC
      const connectionParams = {
        host: process.env.PLC_IP || '10.21.178.100',
        port: 102,
        rack: parseInt(process.env.PLC_RACK || '0'),
        slot: parseInt(process.env.PLC_SLOT || '3'),
        timeout: 5000
      };

      // Intentar escribir en el PLC real
      try {
        // Crear una promesa para manejar la conexión asíncrona
        const writeResult = await new Promise<boolean>((resolve, reject) => {
          // Conectar al PLC
          conn.initiateConnection(connectionParams, (err: any) => {
            if (err) {
              logger.error('Error al conectar con el PLC para escritura:', err);
              reject(err);
              return;
            }

            // Añadir variable para escribir
            conn.addItems([address]);

            // Escribir el valor
            conn.writeItems(address, value, (errWrite: any) => {
              if (errWrite) {
                logger.error('Error al escribir en el PLC:', errWrite);
                reject(errWrite);
                return;
              }

              // Desconectar después de escribir
              conn.dropConnection(() => {
                logger.info('Conexión con el PLC cerrada correctamente después de escribir');
              });

              // Resolver con éxito
              resolve(true);
            });
          });
        });

        // Responder con éxito
        res.status(200).json({
          success: true,
          message: `Valor ${value} escrito correctamente en ${address}`
        });
      } catch (plcError) {
        logger.error('Error al escribir en el PLC real:', plcError);
        
        // Si hay un error con el PLC real, intentar usar el servicio mock
        if (this.service.writeItem) {
          const mockResult = await this.service.writeItem(address, value);
          
          // Responder con el resultado del mock
          res.status(200).json({
            success: mockResult,
            message: mockResult ? `Valor ${value} escrito correctamente en ${address} (mock)` : 'Error al escribir en el mock',
            source: 'mock'
          });
        } else {
          throw plcError;
        }
      }
    } catch (error: any) {
      logger.error('Error al escribir valor en el DB102:', error);
      res.status(500).json({
        success: false,
        error: error.message || 'Error al escribir valor en el DB102'
      });
    }
  };
}

export default DB102Controller;