// src/controllers/db110Controller.ts
import { Request, Response } from 'express';
import { logger } from '../utils/logger';
import { query } from '../db/mariadb-config';

// Importar nodes7 de forma dinámica para evitar problemas de tipado
const nodes7 = require('nodes7');
// Importar el controlador PTMariaDBController para la sincronización con MariaDB
const ptController = require('./ptMariaDBController');

// Interfaz para el servicio PLC
interface PLCServiceInterface {
  readAllItems?(): Promise<Record<string, any>>;
  writeItem?(address: string, value: any): Promise<boolean> | boolean;
}

export class DB110Controller {
  private service: PLCServiceInterface;

  constructor(service?: PLCServiceInterface) {
    this.service = service || {};
  }

  // Obtener todos los valores del DB110 (Puente Transferidor)
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
              logger.error('Error al conectar con el PLC para DB110:', err);
              reject(err);
              return;
            }

            // Añadir variables para leer - Específicas del Puente Transferidor
            conn.addItems(['DB110,B30', 'DB110,B31', 'DB110,B32', 'DB110,B33']);

            // Leer todas las variables
            conn.readAllItems((err: any, values: Record<string, any>) => {
              // Desconectar del PLC después de leer
              conn.dropConnection(() => {
                logger.info('Desconectado del PLC después de leer valores del Puente Transferidor');
              });

              if (err) {
                logger.error('Error al leer valores del PLC para DB110:', err);
                reject(err);
                return;
              }
              
              // Devolver los valores leídos
              console.log('Valores leídos del PLC para Puente Transferidor:', values);
              resolve(values);
            });
          });
        });
        
        // Verificar si los valores del PLC son válidos
        const hasValidValues = Object.values(plcValues).some(value => value !== null && value !== undefined);
        
        if (hasValidValues) {
          logger.info('Valores leídos correctamente del PLC real para Puente Transferidor');
          
          // Formatear los datos para la respuesta
          const formattedData = this.formatDB110Data(plcValues);
          
          // Mostrar algunos valores para depuración
          console.log('Enviando datos reales del Puente Transferidor al cliente:', {
            ocupacion: formattedData.ocupacion.value,
            estado: formattedData.estado.value,
            situacion: formattedData.situacion.value,
            posicion: formattedData.posicion.value
          });
          
          // Sincronizar los datos con la tabla PT_Status de MariaDB usando el controlador PT
          try {
            const ptData = {
              ocupacion: formattedData.ocupacion.value,
              estado: formattedData.estado.value,
              situacion: formattedData.situacion.value,
              posicion: formattedData.posicion.value
            };
            
            // Usar el controlador PTMariaDBController para guardar los datos
            await ptController.saveToDatabase(ptData);
            logger.info('Datos del Puente Transferidor sincronizados con MariaDB usando PTMariaDBController');
          } catch (syncError) {
            logger.error('Error al sincronizar datos del Puente Transferidor con MariaDB:', syncError);
          }
          
          res.json(formattedData);
          return;
        }
      } catch (plcError) {
        logger.error('Error al leer valores del PLC real para DB110:', plcError);
        logger.warn('No se pudo conectar con el PLC real para el Puente Transferidor. Asegúrese de que el PLC esté encendido y accesible.');
        
        // No hay modo simulación, devolver error
        res.status(500).json({
          success: false,
          message: 'Error al obtener datos del PLC para el Puente Transferidor',
          error: (plcError as Error).message
        });
        return;
      }
    } catch (error) {
      logger.error('Error al obtener valores del DB110:', error);
      res.status(500).json({
        success: false,
        message: 'Error al obtener datos del Puente Transferidor',
        error: (error as Error).message
      });
    }
  };

  // Formatear los datos del DB110 para la respuesta
  private formatDB110Data(values: Record<string, any>) {
    // Mapear los valores a un formato más amigable
    const mappedValues = {
      ocupacion: values['DB110,DBB30'] !== undefined ? values['DB110,DBB30'] : 0,
      estado: values['DB110,DBB31'] !== undefined ? values['DB110,DBB31'] : 0,
      situacion: values['DB110,DBB32'] !== undefined ? values['DB110,DBB32'] : 0,
      posicion: values['DB110,DBB33'] !== undefined ? values['DB110,DBB33'] : 1
    };

    // Formatear los datos con descripciones
    return {
      ocupacion: {
        value: mappedValues.ocupacion,
        description: this.getOcupacionText(mappedValues.ocupacion),
        address: 'DB110,DBB30'
      },
      estado: {
        value: mappedValues.estado,
        description: this.getEstadoText(mappedValues.estado),
        address: 'DB110,DBB31'
      },
      situacion: {
        value: mappedValues.situacion,
        description: this.getSituacionText(mappedValues.situacion),
        address: 'DB110,DBB32'
      },
      posicion: {
        value: mappedValues.posicion,
        description: `Posición ${mappedValues.posicion}`,
        address: 'DB110,DBB33'
      }
    };
  }

  // Convertir el valor según el tipo de dato esperado
  private convertValue(address: string, value: any): any {
    if (address.includes(',X')) {
      // Bit (0 o 1)
      return value ? 1 : 0;
    } else if (address.includes(',B') || address.includes(',DBB')) {
      // Byte (0-255)
      const numValue = Number(value);
      return isNaN(numValue) ? 0 : Math.min(255, Math.max(0, Math.floor(numValue)));
    } else if (address.includes(',W') || address.includes(',DBW')) {
      // Word (0-65535)
      const numValue = Number(value);
      return isNaN(numValue) ? 0 : Math.min(65535, Math.max(0, Math.floor(numValue)));
    } else {
      // Valor por defecto
      return value;
    }
  }

  // Funciones auxiliares para obtener textos descriptivos
  private getOcupacionText(ocupacion: number): string {
    switch (ocupacion) {
      case 0: return 'LIBRE';
      case 1: return 'OCUPADO';
      default: return 'DESCONOCIDO';
    }
  }

  private getEstadoText(estado: number): string {
    switch (estado) {
      case 0: return 'OK';
      case 1: return 'AVERÍA';
      default: return 'DESCONOCIDO';
    }
  }

  private getSituacionText(situacion: number): string {
    switch (situacion) {
      case 0: return 'PARADO';
      case 1: return 'EN MOVIMIENTO';
      default: return 'DESCONOCIDO';
    }
  }

  // Este método ya no es necesario porque usamos el controlador PTMariaDBController
  // para sincronizar los datos con MariaDB

  // Escribir valores en el DB110
  public writeValue = async (req: Request, res: Response): Promise<void> => {
    try {
      const { address, value } = req.body;
      
      if (!address || value === undefined) {
        res.status(400).json({
          success: false,
          message: 'Se requieren los campos address y value'
        });
        return;
      }

      // Validar que la dirección corresponda al DB110
      if (!address.startsWith('DB110')) {
        res.status(400).json({
          success: false,
          message: 'La dirección debe corresponder al DB110'
        });
        return;
      }

      // Convertir el valor según el tipo de dirección
      const convertedValue = this.convertValue(address, value);

      // Escribir el valor en el PLC
      const conn = new nodes7();
      const connectionParams = {
        host: process.env.PLC_IP || '10.21.178.100',
        port: 102,
        rack: parseInt(process.env.PLC_RACK || '0'),
        slot: parseInt(process.env.PLC_SLOT || '3'),
        timeout: 5000
      };

      await new Promise<void>((resolve, reject) => {
        conn.initiateConnection(connectionParams, (err: any) => {
          if (err) {
            logger.error('Error al conectar con el PLC para escribir en DB110:', err);
            reject(err);
            return;
          }

          // Escribir el valor
          conn.writeItems(address, convertedValue, (err: any) => {
            // Desconectar del PLC después de escribir
            conn.dropConnection(() => {
              logger.info('Desconectado del PLC después de escribir en DB110');
            });

            if (err) {
              logger.error('Error al escribir en el PLC para DB110:', err);
              reject(err);
              return;
            }

            logger.info(`Valor ${convertedValue} escrito correctamente en ${address}`);
            resolve();
          });
        });
      });

      res.json({
        success: true,
        message: `Valor ${convertedValue} escrito correctamente en ${address}`
      });
    } catch (error) {
      logger.error('Error al escribir en el DB110:', error);
      res.status(500).json({
        success: false,
        message: 'Error al escribir en el Puente Transferidor',
        error: (error as Error).message
      });
    }
  };
}