// src/controllers/db101Controller.ts
import { Request, Response } from 'express';
import { logger } from '../utils/logger';

// Importar nodes7 de forma dinámica para evitar problemas de tipado
const nodes7 = require('nodes7');

// Interfaz para el servicio PLC
interface PLCServiceInterface {
  readAllItems?(): Promise<Record<string, any>>;
  writeItem?(address: string, value: any): Promise<boolean> | boolean;
}

export class DB101Controller {
  private service: PLCServiceInterface;

  constructor(service: PLCServiceInterface) {
    this.service = service;
  }

  // Obtener todos los valores del DB101
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

            // Añadir variables para leer
            conn.addItems(['DB101,B0', 'DB101,B1', 'DB101,B2', 'DB101,W10', 'DB101,W12', 'DB101,W14', 'DB101,W16', 'DB101,B18', 'DB101,B20', 'DB101,B22', 'DB101,B23', 'DB101,B24', 'DB101,B25', 'DB101,B27', 'DB101,B28', 'DB101,B29', 'DB101,B30', 'DB101,W32', 'DB101,B40', 'DB101,B41', 'DB101,B42', 'DB101,B43', 'DB101,B44', 'DB101,B45']);

            // Leer todas las variables
            conn.readAllItems((err: any, values: Record<string, any>) => {
              // Desconectar del PLC después de leer
              conn.dropConnection(() => {
                logger.info('Desconectado del PLC después de leer valores');
              });

              if (err) {
                logger.error('Error al leer valores del PLC:', err);
                reject(err);
                return;
              }
              
              // Devolver los valores leídos
              console.log('Valores leídos del PLC:', values);
              resolve(values);
            });
          });
        });
        
        // Verificar si los valores del PLC son válidos
        const hasValidValues = Object.values(plcValues).some(value => value !== null && value !== undefined);
        
        if (hasValidValues) {
          logger.info('Valores leídos correctamente del PLC real');
          
          // Formatear los datos para la respuesta
          const formattedData = this.formatDB101Data(plcValues);
          
          // Mostrar algunos valores para depuración
          console.log('Enviando datos reales al cliente:', {
            modo: formattedData.estado.modo.value,
            x: formattedData.coordenadas.x.value,
            y: formattedData.coordenadas.y.value,
            z: formattedData.coordenadas.z.value,
            estadoFinOrden: formattedData.finOrden.estado.value
          });
          
          res.json(formattedData);
          return;
        }
      } catch (plcError) {
        logger.error('Error al leer valores del PLC real:', plcError);
        logger.warn('No se pudo conectar con el PLC real. Asegúrese de que el PLC esté encendido y accesible.');
        
        // No hay modo simulación, devolver error
        res.status(500).json({
          success: false,
          message: 'Error al obtener datos del PLC para TLV1',
          error: (plcError as Error).message
        });
        return;
      }
    } catch (error) {
      logger.error('Error al obtener valores del DB101:', error);
      res.status(500).json({ error: 'Error al obtener valores del DB101' });
    }
  };

  // Escribir un valor en el DB101
  public writeValue = async (req: Request, res: Response): Promise<void> => {
    try {
      const { address, value } = req.body;

      if (!address || value === undefined) {
        res.status(400).json({ error: 'Se requieren dirección y valor' });
        return;
      }

      // Crear una nueva conexión para la escritura
      const conn = new nodes7();

      // Configuración de conexión al PLC
      const connectionParams = {
        host: process.env.PLC_IP || '10.21.178.100',
        port: 102,
        rack: parseInt(process.env.PLC_RACK || '0'),
        slot: parseInt(process.env.PLC_SLOT || '3'),
        timeout: 5000
      };

      // Convertir el valor según el tipo de dato esperado
      const convertedValue = this.convertValue(address, value);

      try {
        // Crear una promesa para manejar la conexión asíncrona
        await new Promise<void>((resolve, reject) => {
          // Conectar al PLC
          conn.initiateConnection(connectionParams, (err: any) => {
            if (err) {
              logger.error('Error al conectar con el PLC:', err);
              reject(err);
              return;
            }

            // Escribir el valor
            conn.writeItems(address, convertedValue, (err: any) => {
              // Desconectar del PLC después de escribir
              conn.dropConnection(() => {
                logger.info('Desconectado del PLC después de escribir valor');
              });

              if (err) {
                logger.error(`Error al escribir en ${address}: ${value}`, err);
                reject(err);
                return;
              }
              
              resolve();
            });
          });
        });
        
        // Si no hay error, consideramos que fue exitoso
        logger.info(`Valor escrito en ${address}: ${value}`);
        res.json({ success: true, address, value: convertedValue });
      } catch (writeError) {
        logger.error(`Error al escribir en ${address}: ${value}`, writeError);
        res.status(500).json({ error: `Error al escribir en ${address}` });
      }
    } catch (error) {
      logger.error('Error al escribir valor en el DB101:', error);
      res.status(500).json({ error: 'Error al escribir valor en el DB101' });
    }
  };

  // Leer un valor específico del DB101
  public readValue = async (req: Request, res: Response): Promise<void> => {
    try {
      const { address } = req.query;

      if (!address || typeof address !== 'string') {
        res.status(400).json({ error: 'Se requiere una dirección válida' });
        return;
      }

      // Crear una nueva conexión para la lectura
      const conn = new nodes7();

      // Configuración de conexión al PLC
      const connectionParams = {
        host: process.env.PLC_IP || '10.21.178.100',
        port: 102,
        rack: parseInt(process.env.PLC_RACK || '0'),
        slot: parseInt(process.env.PLC_SLOT || '3'),
        timeout: 5000
      };

      try {
        // Crear una promesa para manejar la conexión asíncrona
        const value = await new Promise<any>((resolve, reject) => {
          // Conectar al PLC
          conn.initiateConnection(connectionParams, (err: any) => {
            if (err) {
              logger.error('Error al conectar con el PLC:', err);
              reject(err);
              return;
            }

            // Añadir variable para leer
            conn.addItems([address]);

            // Leer la variable
            conn.readAllItems((err: any, values: Record<string, any>) => {
              // Desconectar del PLC después de leer
              conn.dropConnection(() => {
                logger.info('Desconectado del PLC después de leer valor');
              });

              if (err) {
                logger.error('Error al leer valor del PLC:', err);
                reject(err);
                return;
              }
              
              // Devolver el valor leído
              resolve(values[address]);
            });
          });
        });

        // Verificar si el valor es válido
        if (value !== undefined && value !== null) {
          logger.info(`Valor leído de ${address}: ${value}`);
          res.json({ address, value });
        } else {
          res.status(404).json({ error: `No se pudo leer el valor de ${address}` });
        }
      } catch (plcError) {
        logger.error(`Error al leer valor de ${address}:`, plcError);
        res.status(500).json({
          success: false,
          message: `Error al leer valor de ${address}`,
          error: (plcError as Error).message
        });
      }
    } catch (error) {
      logger.error('Error al leer valor del DB101:', error);
      res.status(500).json({ error: 'Error al leer valor del DB101' });
    }
  };

  // Formatear los datos del DB101 para la respuesta
  private formatDB101Data(values: Record<string, any>) {
    // Agrupar los datos por categorías
    return {
      estado: {
        modo: {
          value: values['DB101,B0'] !== undefined ? values['DB101,B0'] : null,
          description: this.getModeText(values['DB101,B0']),
          address: 'DB101,B0'
        },
        ocupacion: {
          value: values['DB101,B1'] !== undefined ? values['DB101,B1'] : null,
          description: values['DB101,B1'] ? 'OCUPADO' : 'LIBRE',
          address: 'DB101,B1'
        },
        averia: {
          value: values['DB101,B2'] !== undefined ? values['DB101,B2'] : null,
          description: values['DB101,B2'] ? 'AVERÍA' : 'OK',
          address: 'DB101,B2'
        }
      },
      coordenadas: {
        x: {
          value: values['DB101,W10'] !== undefined ? values['DB101,W10'] : null,
          address: 'DB101,W10'
        },
        y: {
          value: values['DB101,W12'] !== undefined ? values['DB101,W12'] : null,
          address: 'DB101,W12'
        },
        z: {
          value: values['DB101,W14'] !== undefined ? values['DB101,W14'] : null,
          address: 'DB101,W14'
        },
        matricula: {
          value: values['DB101,W16'] !== undefined ? values['DB101,W16'] : null,
          address: 'DB101,W16'
        },
        pasillo: {
          value: values['DB101,B18'] !== undefined ? values['DB101,B18'] : null,
          address: 'DB101,B18'
        }
      },
      orden: {
        tipo: {
          value: values['DB101,B20'] !== undefined ? values['DB101,B20'] : null,
          description: this.getOrderTypeText(values['DB101,B20']),
          address: 'DB101,B20'
        },
        origen: {
          pasillo: {
            value: values['DB101,B22'] !== undefined ? values['DB101,B22'] : null,
            address: 'DB101,B22'
          },
          x: {
            value: values['DB101,B23'] !== undefined ? values['DB101,B23'] : null,
            address: 'DB101,B23'
          },
          y: {
            value: values['DB101,B24'] !== undefined ? values['DB101,B24'] : null,
            address: 'DB101,B24'
          },
          z: {
            value: values['DB101,B25'] !== undefined ? values['DB101,B25'] : null,
            address: 'DB101,B25'
          }
        },
        destino: {
          pasillo: {
            value: values['DB101,B27'] !== undefined ? values['DB101,B27'] : null,
            address: 'DB101,B27'
          },
          x: {
            value: values['DB101,B28'] !== undefined ? values['DB101,B28'] : null,
            address: 'DB101,B28'
          },
          y: {
            value: values['DB101,B29'] !== undefined ? values['DB101,B29'] : null,
            address: 'DB101,B29'
          },
          z: {
            value: values['DB101,B30'] !== undefined ? values['DB101,B30'] : null,
            address: 'DB101,B30'
          }
        },
        matricula: {
          value: values['DB101,W32'] !== undefined ? values['DB101,W32'] : null,
          address: 'DB101,W32'
        }
      },
      finOrden: {
        estado: {
          value: values['DB101,B40'] !== undefined ? values['DB101,B40'] : null,
          description: this.getFinOrdenEstadoText(values['DB101,B40']),
          address: 'DB101,B40'
        },
        resultado: {
          value: values['DB101,B41'] !== undefined ? values['DB101,B41'] : null,
          description: this.getFinOrdenResultadoText(values['DB101,B41']),
          address: 'DB101,B41'
        },
        destino: {
          pasillo: {
            value: values['DB101,B42'] !== undefined ? values['DB101,B42'] : null,
            address: 'DB101,B42'
          },
          x: {
            value: values['DB101,B43'] !== undefined ? values['DB101,B43'] : null,
            address: 'DB101,B43'
          },
          y: {
            value: values['DB101,B44'] !== undefined ? values['DB101,B44'] : null,
            address: 'DB101,B44'
          },
          z: {
            value: values['DB101,B45'] !== undefined ? values['DB101,B45'] : null,
            address: 'DB101,B45'
          }
        }
      }
    };
  }

  // Convertir el valor según el tipo de dato esperado
  private convertValue(address: string, value: any): any {
    // Determinar el tipo de dato basado en la dirección
    if (address.includes(',X')) {
      // Bit (boolean)
      return value === true || value === 1 || value === '1' || value === 'true';
    } else if (address.includes(',B')) {
      // Byte (0-255)
      const numValue = Number(value);
      return isNaN(numValue) ? 0 : Math.min(255, Math.max(0, Math.floor(numValue)));
    } else if (address.includes(',W')) {
      // Word (0-65535)
      const numValue = Number(value);
      return isNaN(numValue) ? 0 : Math.min(65535, Math.max(0, Math.floor(numValue)));
    } else {
      // Valor por defecto
      return value;
    }
  }

  // Funciones auxiliares para obtener textos descriptivos
  private getModeText(mode: number): string {
    switch (mode) {
      case 0: return 'AUTOMÁTICO';
      case 1: return 'SEMIAUTOMÁTICO';
      case 2: return 'MANUAL';
      default: return 'DESCONOCIDO';
    }
  }

  private getOrderTypeText(type: number): string {
    switch (type) {
      case 0: return 'SIN ORDEN';
      case 1: return 'DEPÓSITO';
      case 2: return 'EXTRACCIÓN';
      case 3: return 'CAMBIO PASILLO';
      case 4: return 'TRASVASE';
      case 5: return 'TEST';
      default: return 'DESCONOCIDO';
    }
  }

  private getFinOrdenEstadoText(estado: number): string {
    switch (estado) {
      case 0: return 'SIN ORDEN';
      case 1: return 'EN CURSO';
      case 2: return 'FIN DE ORDEN';
      default: return 'DESCONOCIDO';
    }
  }

  private getFinOrdenResultadoText(resultado: number): string {
    switch (resultado) {
      case 0: return 'OK DEPÓSITO';
      case 2: return 'OK EXTRACCIÓN';
      case 3: return 'ERROR DEPÓSITO';
      case 4: return 'ERROR EXTRACCIÓN';
      case 5: return 'OK TRASVASE';
      case 6: return 'ABORTADO';
      default: return 'DESCONOCIDO';
    }
  }

  // Escribir todas las variables del DB101 de una vez
  public writeAllValues = async (req: Request, res: Response): Promise<void> => {
    try {
      const data = req.body;
      // Mapeo de campos a direcciones del PLC
      const addressMap = {
        modo: 'DB101,B0',
        ocupacion: 'DB101,X0.0',
        averia: 'DB101,X0.1',
        coord_x: 'DB101,W10',
        coord_y: 'DB101,W12',
        coord_z: 'DB101,W14',
        matricula: 'DB101,W16',
        pasillo: 'DB101,B18',
        tipo_orden: 'DB101,B20',
        fin_orden_estado: 'DB101,B40',
        fin_orden_resultado: 'DB101,B41'
      };
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
          if (err) return reject(err);
          
          // Crear un objeto con pares dirección-valor para writeItems
          const itemsToWrite: Record<string, any> = {};
          
          // Recorrer las claves del mapa de direcciones
          Object.keys(addressMap).forEach(key => {
            const address = addressMap[key as keyof typeof addressMap];
            if (data[key] !== undefined) {
              // Convertir el valor según el tipo de dirección
              itemsToWrite[address] = this.convertValue(address, data[key]);
            }
          });
          
          // Verificar que haya elementos para escribir
          if (Object.keys(itemsToWrite).length === 0) {
            logger.warn('No hay valores válidos para escribir en el PLC');
            return resolve();
          }
          
          // Escribir los elementos en el PLC
          conn.writeItems(itemsToWrite, (err: any) => {
            conn.dropConnection(() => {
              logger.info('Desconectado del PLC después de escribir valores');
            });
            
            if (err) return reject(err);
            resolve();
          });
        });
      });
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ success: false, message: 'Error al escribir en el PLC', error: error.message });
    }
  };
}
// Solo exportamos la clase, no como default
