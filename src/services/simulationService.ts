// src/services/simulationService.ts
import { EventEmitter } from 'events';

// Constantes para la simulación de los transelevadores
const MAX_PASILLO = 12;
const MAX_ALTURA = 59;
const MAX_MATRICULA = 30000;

// Tipos de datos para la simulación de los transelevadores
interface TLV1Data {
  // Estado del transelevador
  modo: number;           // 0=AUTOMÁTICO 1=SEMIAUTOMÁTICO 2=MANUAL
  ocupacion: number;      // 0=LIBRE 1=OCUPADO
  averia: number;         // 0=OK 1=AVERIA
  
  // Coordenadas actuales
  coord_x: number;        // Coordenada X actual
  coord_y: number;        // Coordenada Y actual
  coord_z: number;        // Coordenada Z actual
  matricula: number;      // Matrícula actual
  pasillo: number;        // Pasillo actual
  
  // Datos de orden en curso
  orden_tipo: number;     // 0=SIN ORDEN 1=DEPÓSITO 2=EXTRACCIÓN 3=CAMBIO PASILLO 4=TRASVASE 5=TEST
  orden_pasillo_origen: number;    // Pasillo origen
  orden_coord_x_origen: number;    // Coordenada X origen
  orden_coord_y_origen: number;    // Coordenada Y origen
  orden_coord_z_origen: number;    // Coordenada Z origen (1=IZQUIERDA 2=DERECHA)
  orden_pasillo_destino: number;   // Pasillo destino
  orden_coord_x_destino: number;   // Coordenada X destino
  orden_coord_y_destino: number;   // Coordenada Y destino
  orden_coord_z_destino: number;   // Coordenada Z destino (1=IZQUIERDA 2=DERECHA)
  orden_matricula: number;         // Matrícula
  
  // Fin de orden
  fin_orden_estado: number;        // 0=SIN ORDEN 1=EN CURSO 2=FIN DE ORDEN
  fin_orden_resultado: number;     // 0=OK DEP. 2=OK EXT. 3=ERROR DEP. 4=ERROR EXT. 5=OK TRANS. 6=ABORTADO
  fin_orden_pasillo_destino: number; // Pasillo destino final
  fin_orden_coord_x_destino: number; // Coordenada X destino final
  fin_orden_coord_y_destino: number; // Coordenada Y destino final
  fin_orden_coord_z_destino: number; // Coordenada Z destino final (1=IZQUIERDA 2=DERECHA)
}

class SimulationService extends EventEmitter {
  private tlv1Data: TLV1Data = {
    // Estado del transelevador
    modo: 0,             // AUTOMÁTICO
    ocupacion: 0,        // LIBRE
    averia: 0,           // OK
    
    // Coordenadas actuales
    coord_x: 1,          // Posición X inicial
    coord_y: 1,          // Posición Y inicial
    coord_z: 1,          // Posición Z inicial (IZQUIERDA)
    matricula: 0,        // Sin matrícula
    pasillo: 1,          // Pasillo 1
    
    // Datos de orden en curso
    orden_tipo: 0,       // SIN ORDEN
    orden_pasillo_origen: 0,
    orden_coord_x_origen: 0,
    orden_coord_y_origen: 0,
    orden_coord_z_origen: 0,
    orden_pasillo_destino: 0,
    orden_coord_x_destino: 0,
    orden_coord_y_destino: 0,
    orden_coord_z_destino: 0,
    orden_matricula: 0,
    
    // Fin de orden
    fin_orden_estado: 0,  // SIN ORDEN
    fin_orden_resultado: 0,
    fin_orden_pasillo_destino: 0,
    fin_orden_coord_x_destino: 0,
    fin_orden_coord_y_destino: 0,
    fin_orden_coord_z_destino: 0
  };
  
  private plcValues: Record<string, number> = {};
  private simulationInterval: NodeJS.Timeout | null = null;
  private simulationActive: boolean = false;

  constructor() {
    super();
    this.updatePLCValues(); // Actualizar valores iniciales
  }

  // Actualiza los valores del PLC basados en los datos de los transelevadores
  private updatePLCValues(): void {
    // Mapear los datos de los transelevadores a las variables del PLC
    this.plcValues = {
      // Estado del transelevador TLV1
      'DB101.DBB0': this.tlv1Data.modo,
      'DB101.DBB1': this.tlv1Data.ocupacion,
      'DB101.DBB2': this.tlv1Data.averia,
      
      // Coordenadas actuales TLV1
      'DB101.DBW10': this.tlv1Data.coord_x,
      'DB101.DBW12': this.tlv1Data.coord_y,
      'DB101.DBW14': this.tlv1Data.coord_z,
      'DB101.DBW16': this.tlv1Data.matricula,
      'DB101.DBB18': this.tlv1Data.pasillo,
      
      // Datos de orden en curso TLV1
      'DB101.DBB20': this.tlv1Data.orden_tipo,
      
      // Fin de orden TLV1
      'DB101.DBB40': this.tlv1Data.fin_orden_estado,
      'DB101.DBB41': this.tlv1Data.fin_orden_resultado,
      'DB101.DBB42': this.tlv1Data.fin_orden_pasillo_destino,
      'DB101.DBB43': this.tlv1Data.fin_orden_coord_x_destino,
      'DB101.DBB44': this.tlv1Data.fin_orden_coord_y_destino,
      'DB101.DBB45': this.tlv1Data.fin_orden_coord_z_destino
    };
  }

  public startSimulation(interval: number = 1000): void {
    if (this.simulationActive) return;
    
    console.log('Iniciando simulación del transelevador TLV1...');
    this.simulationActive = true;
    this.simulationInterval = setInterval(() => {
      this.updateTLV1State();
      this.updatePLCValues();
      this.emit('data', this.plcValues);
    }, interval);
  }

  public stopSimulation(): void {
    if (!this.simulationActive) return;
    
    console.log('Deteniendo simulación del transelevador TLV1...');
    if (this.simulationInterval) {
      clearInterval(this.simulationInterval);
      this.simulationInterval = null;
    }
    this.simulationActive = false;
    
    // Reiniciar valores por defecto
    this.tlv1Data = {
      // Estado del transelevador
      modo: 0,             // AUTOMÁTICO
      ocupacion: 0,        // LIBRE
      averia: 0,           // OK
      
      // Coordenadas actuales
      coord_x: 1,          // Posición X inicial
      coord_y: 1,          // Posición Y inicial
      coord_z: 1,          // Posición Z inicial (IZQUIERDA)
      matricula: 0,        // Sin matrícula
      pasillo: 1,          // Pasillo 1
      
      // Datos de orden en curso
      orden_tipo: 0,       // SIN ORDEN
      orden_pasillo_origen: 0,
      orden_coord_x_origen: 0,
      orden_coord_y_origen: 0,
      orden_coord_z_origen: 0,
      orden_pasillo_destino: 0,
      orden_coord_x_destino: 0,
      orden_coord_y_destino: 0,
      orden_coord_z_destino: 0,
      orden_matricula: 0,
      
      // Fin de orden
      fin_orden_estado: 0,  // SIN ORDEN
      fin_orden_resultado: 0,
      fin_orden_pasillo_destino: 0,
      fin_orden_coord_x_destino: 0,
      fin_orden_coord_y_destino: 0,
      fin_orden_coord_z_destino: 0
    };
    
    // Actualizar los valores del PLC
    this.updatePLCValues();
    
    console.log('Simulación del transelevador TLV1 detenida correctamente');
  }

  private updateTLV1State(): void {
    // Solo actualizar si está en modo automático
    if (this.tlv1Data.modo === 0) {
      // Simular cambios aleatorios en el estado del transelevador
      
      // 1. Simular cambio de modo (ocasionalmente)
      if (Math.random() > 0.98) {
        this.tlv1Data.modo = Math.floor(Math.random() * 3); // 0, 1 o 2
      }
      
      // 2. Simular avería (muy ocasionalmente)
      if (Math.random() > 0.995) {
        this.tlv1Data.averia = this.tlv1Data.averia === 0 ? 1 : 0;
      }
      
      // 3. Simular movimiento si no hay avería
      if (this.tlv1Data.averia === 0) {
        // Simular cambio en la ocupación
        if (Math.random() > 0.9) {
          this.tlv1Data.ocupacion = Math.random() > 0.5 ? 1 : 0;
        }
        
        // Simular cambio en coordenadas X (altura)
        if (Math.random() > 0.7) {
          const step = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
          this.tlv1Data.coord_x = Math.max(1, Math.min(MAX_ALTURA, this.tlv1Data.coord_x + step));
        }
        
        // Simular cambio en coordenadas Y
        if (Math.random() > 0.8) {
          const step = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
          this.tlv1Data.coord_y = Math.max(1, Math.min(59, this.tlv1Data.coord_y + step));
        }
        
        // Simular cambio en coordenadas Z (izquierda/derecha)
        if (Math.random() > 0.9) {
          this.tlv1Data.coord_z = this.tlv1Data.coord_z === 1 ? 2 : 1;
        }
        
        // Simular cambio en pasillo
        if (Math.random() > 0.95) {
          const step = Math.floor(Math.random() * 3) - 1; // -1, 0, 1
          this.tlv1Data.pasillo = Math.max(1, Math.min(MAX_PASILLO, this.tlv1Data.pasillo + step));
        }
        
        // Simular cambio en matrícula (menos frecuente)
        if (Math.random() > 0.98) {
          this.tlv1Data.matricula = Math.floor(Math.random() * MAX_MATRICULA);
        }
      }
      
      // 4. Simular órdenes
      this.simulateOrders();
    }
  }
  
  private simulateOrders(): void {
    // Si no hay orden activa, ocasionalmente crear una nueva
    if (this.tlv1Data.orden_tipo === 0 && Math.random() > 0.95) {
      // Crear una nueva orden aleatoria
      this.tlv1Data.orden_tipo = Math.floor(Math.random() * 5) + 1; // 1-5
      this.tlv1Data.orden_pasillo_origen = Math.floor(Math.random() * MAX_PASILLO) + 1;
      this.tlv1Data.orden_coord_x_origen = Math.floor(Math.random() * MAX_ALTURA) + 1;
      this.tlv1Data.orden_coord_y_origen = Math.floor(Math.random() * 59) + 1;
      this.tlv1Data.orden_coord_z_origen = Math.random() > 0.5 ? 1 : 2;
      this.tlv1Data.orden_pasillo_destino = Math.floor(Math.random() * MAX_PASILLO) + 1;
      this.tlv1Data.orden_coord_x_destino = Math.floor(Math.random() * MAX_ALTURA) + 1;
      this.tlv1Data.orden_coord_y_destino = Math.floor(Math.random() * 59) + 1;
      this.tlv1Data.orden_coord_z_destino = Math.random() > 0.5 ? 1 : 2;
      this.tlv1Data.orden_matricula = Math.floor(Math.random() * MAX_MATRICULA);
      
      // Iniciar estado de fin de orden
      this.tlv1Data.fin_orden_estado = 1; // EN CURSO
    }
    // Si hay una orden activa, ocasionalmente finalizarla
    else if (this.tlv1Data.orden_tipo !== 0 && Math.random() > 0.9) {
      // Finalizar la orden
      this.tlv1Data.fin_orden_estado = 2; // FIN DE ORDEN
      this.tlv1Data.fin_orden_resultado = Math.floor(Math.random() * 7); // 0-6
      this.tlv1Data.fin_orden_pasillo_destino = this.tlv1Data.orden_pasillo_destino;
      this.tlv1Data.fin_orden_coord_x_destino = this.tlv1Data.orden_coord_x_destino;
      this.tlv1Data.fin_orden_coord_y_destino = this.tlv1Data.orden_coord_y_destino;
      this.tlv1Data.fin_orden_coord_z_destino = this.tlv1Data.orden_coord_z_destino;
      
      // Resetear la orden actual después de un tiempo
      if (Math.random() > 0.7) {
        this.tlv1Data.orden_tipo = 0; // SIN ORDEN
        this.tlv1Data.fin_orden_estado = 0; // SIN ORDEN
      }
    }
  }

  // Método para obtener los valores simulados del PLC
  public async readAllItems(): Promise<Record<string, any>> {
    // Simulamos una pequeña latencia para imitar el comportamiento real
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(this.plcValues);
      }, 10);
    });
  }
  
  // Método para escribir un valor en una dirección específica
  public writeItem(address: string, value: any): boolean {
    try {
      // Actualizar el valor en el mapa de valores del PLC
      this.plcValues[address] = value;
      
      // Actualizar los datos del transelevador según la dirección
      this.updateTLV1DataFromPLC(address, value);
      
      return true;
    } catch (error) {
      console.error(`Error al escribir en ${address}:`, error);
      return false;
    }
  }
  
  // Método para escribir una posición completa para un componente
  public async writePosition(id: string, position: any): Promise<boolean> {
    try {
      if (id === 'tlv1') {
        // Actualizar los valores correspondientes en el transelevador TLV1
        if (position.modo !== undefined) {
          this.tlv1Data.modo = position.modo;
          this.plcValues['DB101.DBB0'] = position.modo;
        }
        
        if (position.x !== undefined) {
          this.tlv1Data.coord_x = position.x;
          this.plcValues['DB101.DBW10'] = position.x;
        }
        
        if (position.y !== undefined) {
          this.tlv1Data.coord_y = position.y;
          this.plcValues['DB101.DBW12'] = position.y;
        }
        
        if (position.z !== undefined) {
          this.tlv1Data.coord_z = position.z;
          this.plcValues['DB101.DBW14'] = position.z;
        }
        
        if (position.pasillo !== undefined) {
          this.tlv1Data.pasillo = position.pasillo;
          this.plcValues['DB101.DBB18'] = position.pasillo;
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error(`Error al escribir posición para ${id}:`, error);
      return false;
    }
  }

  private updateTLV1DataFromPLC(address: string, value: any): void {
    switch (address) {
      case 'DB101.DBB0':
        this.tlv1Data.modo = value;
        break;
      case 'DB101.DBB1':
        this.tlv1Data.ocupacion = value;
        break;
      case 'DB101.DBB2':
        this.tlv1Data.averia = value;
        break;
      case 'DB101.DBW10':
        this.tlv1Data.coord_x = value;
        break;
      case 'DB101.DBW12':
        this.tlv1Data.coord_y = value;
        break;
      case 'DB101.DBW14':
        this.tlv1Data.coord_z = value;
        break;
      case 'DB101.DBW16':
        this.tlv1Data.matricula = value;
        break;
      case 'DB101.DBB18':
        this.tlv1Data.pasillo = value;
        break;
      case 'DB101.DBB20':
        this.tlv1Data.orden_tipo = value;
        break;
      case 'DB101.DBB22':
        this.tlv1Data.orden_pasillo_origen = value;
        break;
      case 'DB101.DBB23':
        this.tlv1Data.orden_coord_x_origen = value;
        break;
      case 'DB101.DBB24':
        this.tlv1Data.orden_coord_y_origen = value;
        break;
      case 'DB101.DBB25':
        this.tlv1Data.orden_coord_z_origen = value;
        break;
      case 'DB101.DBB27':
        this.tlv1Data.orden_pasillo_destino = value;
        break;
      case 'DB101.DBB28':
        this.tlv1Data.orden_coord_x_destino = value;
        break;
      case 'DB101.DBB29':
        this.tlv1Data.orden_coord_y_destino = value;
        break;
      case 'DB101.DBB30':
        this.tlv1Data.orden_coord_z_destino = value;
        break;
      case 'DB101.DBW32':
        this.tlv1Data.orden_matricula = value;
        break;
      case 'DB101.DBB40':
        this.tlv1Data.fin_orden_estado = value;
        break;
      case 'DB101.DBB41':
        this.tlv1Data.fin_orden_resultado = value;
        break;
      case 'DB101.DBB42':
        this.tlv1Data.fin_orden_pasillo_destino = value;
        break;
      case 'DB101.DBB43':
        this.tlv1Data.fin_orden_coord_x_destino = value;
        break;
      case 'DB101.DBB44':
        this.tlv1Data.fin_orden_coord_y_destino = value;
        break;
      case 'DB101.DBB45':
        this.tlv1Data.fin_orden_coord_z_destino = value;
        break;
    }
    
    // Actualizar los valores del PLC después de modificar los datos
    this.updatePLCValues();
  }
  
  // Formatear los datos del transelevador TLV1 para el frontend
  public async formatTLV1Data() {
    // Extraer los valores relevantes del transelevador TLV1
    const tlv1 = {
      id: "tlv1",
      name: "Transelevador TLV1",
      type: "transelevador",
      status: this.getTLV1Status(),
      position: {
        x: this.tlv1Data.coord_x,
        y: this.tlv1Data.coord_y,
        z: this.tlv1Data.coord_z,
        pasillo: this.tlv1Data.pasillo
      },
      mode: this.getModeText(this.tlv1Data.modo),
      occupied: this.tlv1Data.ocupacion === 1,
      error: this.tlv1Data.averia === 1,
      currentOrder: {
        type: this.getOrderTypeText(this.tlv1Data.orden_tipo),
        origin: {
          pasillo: this.tlv1Data.orden_pasillo_origen,
          x: this.tlv1Data.orden_coord_x_origen,
          y: this.tlv1Data.orden_coord_y_origen,
          z: this.tlv1Data.orden_coord_z_origen
        },
        destination: {
          pasillo: this.tlv1Data.orden_pasillo_destino,
          x: this.tlv1Data.orden_coord_x_destino,
          y: this.tlv1Data.orden_coord_y_destino,
          z: this.tlv1Data.orden_coord_z_destino
        },
        matricula: this.tlv1Data.orden_matricula
      }
    };

    return tlv1;
  }
  
  // Obtener el estado del transelevador TLV1
  private getTLV1Status(): "active" | "inactive" | "error" | "moving" {
    if (this.tlv1Data.averia === 1) {
      return "error";
    }
    if (this.tlv1Data.ocupacion === 1) {
      return "moving";
    }
    if (this.tlv1Data.modo === 0) {
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
  
  private getFinOrdenEstadoText(estado: number): string {
    switch (estado) {
      case 0: return "SIN ORDEN";
      case 1: return "EN CURSO";
      case 2: return "FIN DE ORDEN";
      default: return "DESCONOCIDO";
    }
  }
  
  private getFinOrdenResultadoText(resultado: number): string {
    switch (resultado) {
      case 0: return "OK DEPÓSITO";
      case 2: return "OK EXTRACCIÓN";
      case 3: return "ERROR DEPÓSITO";
      case 4: return "ERROR EXTRACCIÓN";
      case 5: return "OK TRASVASE";
      case 6: return "ABORTADO";
      default: return "DESCONOCIDO";
    }
  }
}

export default SimulationService;
