// src/controllers/componentController.ts
import { Request, Response } from 'express';
import PLCService from '../services/plcService';
import SimulationService from '../services/simulationService';
import { logger } from '../utils/logger';

// Interfaz común para los servicios de PLC y simulación
interface PLCServiceInterface {
  on(event: string, listener: (...args: any[]) => void): this;
  emit(event: string, ...args: any[]): boolean;
  readAllItems?(): Promise<Record<string, any>>;
  writeItem?(address: string, value: any): boolean | Promise<boolean>;
  writePosition?(id: string, position: any): Promise<boolean>;
  startSimulation?(): void;
  stopSimulation?(): void;
}

class ComponentController {
  private plcValues: Record<string, any> = {};
  
  constructor(private service: PLCServiceInterface) {
    // Suscribirse a los eventos de datos del servicio
    this.service.on('data', (data: any) => {
      if (data) {
        this.plcValues = data;
      }
    });
  }

  // Convertir los valores del PLC a un formato más amigable para el frontend
  public async formatTLV1Data() {
    // Si no hay datos, devolver un objeto vacío
    if (Object.keys(this.plcValues).length === 0) {
      return [];
    }

    // Extraer los valores relevantes del transelevador TLV1
    const tlv1 = {
      id: "tlv1",
      name: "Transelevador TLV1",
      type: "transelevador",
      status: this.getTLV1Status(),
      position: {
        x: this.plcValues['DB101.DBW10'] || 0,  // Coordenada X
        y: this.plcValues['DB101.DBW12'] || 0,  // Coordenada Y
        z: this.plcValues['DB101.DBW14'] || 1,  // Coordenada Z
        pasillo: this.plcValues['DB101.DBB18'] || 1  // Pasillo
      },
      mode: this.getModeText(this.plcValues['DB101.DBB0'] || 0),
      occupied: this.plcValues['DB101.DBB1'] === 1,
      error: this.plcValues['DB101.DBB2'] === 1,
      currentOrder: {
        type: this.getOrderTypeText(this.plcValues['DB101.DBB20'] || 0),
        origin: {
          pasillo: this.plcValues['DB101.DBB22'] || 0,
          x: this.plcValues['DB101.DBB23'] || 0,
          y: this.plcValues['DB101.DBB24'] || 0,
          z: this.plcValues['DB101.DBB25'] || 0
        },
        destination: {
          pasillo: this.plcValues['DB101.DBB27'] || 0,
          x: this.plcValues['DB101.DBB28'] || 0,
          y: this.plcValues['DB101.DBB29'] || 0,
          z: this.plcValues['DB101.DBB30'] || 0
        },
        matricula: this.plcValues['DB101.DBW32'] || 0
      }
    };

    return [tlv1];
  }

  // Obtener el estado del transelevador
  private getTLV1Status(): "active" | "inactive" | "error" | "moving" {
    if (this.plcValues['DB101.DBB2'] === 1) {
      return "error";
    }
    if (this.plcValues['DB101.DBB1'] === 1) {
      return "moving";
    }
    if (this.plcValues['DB101.DBB0'] === 0) {
      return "active";
    }
    return "inactive";
  }

  // Obtener el texto del modo
  private getModeText(mode: number): string {
    switch (mode) {
      case 0: return "AUTOMÁTICO";
      case 1: return "SEMIAUTOMÁTICO";
      case 2: return "MANUAL";
      default: return "DESCONOCIDO";
    }
  }

  // Obtener el texto del tipo de orden
  private getOrderTypeText(type: number): string {
    switch (type) {
      case 0: return "SIN ORDEN";
      case 1: return "DEPÓSITO";
      case 2: return "EXTRACCIÓN";
      case 3: return "CAMBIO PASILLO";
      case 4: return "TRASVASE";
      case 5: return "TEST";
      default: return "DESCONOCIDO";
    }
  }

  // Obtener los componentes (transelevador TLV1)
  public getComponents = async (req: Request, res: Response): Promise<void> => {
    try {
      const components = await this.formatTLV1Data();
      res.status(200).json(components);
    } catch (error) {
      logger.error('Error al obtener componentes:', error);
      res.status(500).json({ message: 'Error al obtener componentes', error });
    }
  };

  // Actualizar la posición del transelevador
  public updatePosition = async (req: Request, res: Response): Promise<void> => {
    try {
      const { id } = req.params;
      const { x, y, z, pasillo } = req.body;
      
      let success = false;
      
      // Si es un servicio PLC real con método writePosition
      if (this.service.writePosition) {
        success = await this.service.writePosition(id, { x, y, z, pasillo });
      } 
      // Si es un servicio con método writeItem (simulación)
      else if (this.service.writeItem) {
        // Escribir cada valor por separado
        if (x !== undefined) {
          this.service.writeItem('DB101.DBW10', x);
        }
        if (y !== undefined) {
          this.service.writeItem('DB101.DBW12', y);
        }
        if (z !== undefined) {
          this.service.writeItem('DB101.DBW14', z);
        }
        if (pasillo !== undefined) {
          this.service.writeItem('DB101.DBB18', pasillo);
        }
        success = true;
      }
      
      if (success) {
        res.status(200).json({ message: 'Posición actualizada correctamente' });
      } else {
        res.status(400).json({ message: 'No se pudo actualizar la posición' });
      }
    } catch (error) {
      logger.error('Error al actualizar posición:', error);
      res.status(500).json({ message: 'Error al actualizar la posición', error });
    }
  };
}

export default ComponentController;
