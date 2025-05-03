// src/services/plcService.ts
import { EventEmitter } from 'events';
import { PLCConfig, SiloComponent, PLCVariableMap } from '../types';
import { logger } from '../utils/logger';

// Importación dinámica para evitar problemas con TypeScript
// ya que nodes7 no tiene tipos definidos
const nodes7 = require('nodes7');

class PLCService extends EventEmitter {
  private client: any;
  private connected: boolean = false;
  private variables: PLCVariableMap;
  private cycleInterval: NodeJS.Timeout | null = null;
  private components: SiloComponent[] = [];
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 5;
  private keepAliveInterval: NodeJS.Timeout | null = null;

  constructor(private config: PLCConfig, variables: PLCVariableMap) {
    super();
    this.client = new nodes7();
    this.variables = variables;
    this.maxReconnectAttempts = config.maxRetries || 3;
  }

  public async connect(): Promise<boolean> {
    return new Promise((resolve, reject) => {
      // Si ya estamos conectados, devolver true inmediatamente
      if (this.connected) {
        resolve(true);
        return;
      }
      
      // Configuración optimizada para el PLC S7-400
      const connectionParams = {
        port: 102,
        host: this.config.ip,
        rack: this.config.rack,
        slot: this.config.slot,
        timeout: this.config.connectionTimeout || 10000,
        connectionType: 'PG',
        localTSAP: '0x0100',
        remoteTSAP: '0x0200',
        doNotOptimize: true,
        maxRetries: this.config.maxRetries || 3,
        connectionCheckInterval: this.config.keepAliveInterval || 5000,
        debug: true
      };

      // Función para intentar conectar
      const tryConnect = (params: any, fallbackIndex: number = -1) => {
        logger.info(`Intentando conectar al PLC S7-400 en ${this.config.ip}:${params.port}`);
        
        this.client.initiateConnection(params, (err: Error) => {
          if (err) {
            logger.error('Error al conectar con el PLC S7-400:', err);
            this.connected = false;
            
            if (this.reconnectAttempts < this.maxReconnectAttempts) {
              this.reconnectAttempts++;
              logger.info(`Reintentando conexión (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
              setTimeout(() => tryConnect(params, fallbackIndex + 1), this.config.retryInterval || 2000);
              return;
            }
            
            reject(err);
            return;
          }

          logger.success(`Conectado exitosamente al PLC S7-400 en ${this.config.ip}`);
          this.connected = true;
          this.reconnectAttempts = 0;
          
          try {
            // Añadir variables para monitoreo
            logger.info('Registrando variables para monitoreo...');
            this.client.addItems(Object.values(this.variables));
            
            // Iniciar ciclo de lectura
            this.startReadCycle();
            
            // Iniciar keep-alive
            this.startKeepAlive();
            
            resolve(true);
          } catch (error) {
            logger.error('Error al configurar las variables del PLC:', error);
            this.disconnect();
            reject(error);
          }
        });
      };
      
      tryConnect(connectionParams);
    });
  }

  private startKeepAlive(): void {
    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
    }

    this.keepAliveInterval = setInterval(() => {
      if (this.connected) {
        this.client.readItems(Object.values(this.variables), (err: Error) => {
          if (err) {
            logger.error('Error en keep-alive:', err);
            this.connected = false;
            this.reconnect();
          }
        });
      }
    }, this.config.keepAliveInterval || 5000);
  }

  public disconnect(): void {
    if (this.cycleInterval) {
      clearInterval(this.cycleInterval);
      this.cycleInterval = null;
    }

    if (this.keepAliveInterval) {
      clearInterval(this.keepAliveInterval);
      this.keepAliveInterval = null;
    }
    
    if (this.connected) {
      this.client.dropConnection();
      this.connected = false;
      logger.info('Desconectado del PLC');
    }
  }
  
  /**
   * Intenta reconectar con el PLC después de una desconexión o error
   */
  private async reconnect(): Promise<void> {
    // Solo intentar reconectar si no estamos ya conectados
    if (this.connected) return;
    
    // Limitar el número de intentos de reconexión
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      logger.error(`Se ha alcanzado el número máximo de intentos de reconexión (${this.maxReconnectAttempts})`);
      return;
    }
    
    this.reconnectAttempts++;
    logger.info(`Intentando reconectar con el PLC S7-400... (intento ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    try {
      // Asegurarse de que la conexión anterior esté cerrada
      this.disconnect();
      
      // Esperar un momento antes de intentar reconectar
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Intentar conectar de nuevo
      await this.connect();
      logger.success('Reconexión exitosa con el PLC S7-400');
    } catch (error) {
      logger.error('Error al intentar reconectar con el PLC:', error);
      // No reiniciamos el ciclo de lectura aquí, ya que lo hace el método connect
    }
  }

  private startReadCycle(): void {
    logger.info(`Iniciando ciclo de lectura cada ${this.config.cycleTime}ms`);
    
    // Contador de intentos fallidos consecutivos
    let failedAttempts = 0;
    const MAX_FAILED_ATTEMPTS = 5;
    
    this.cycleInterval = setInterval(() => {
      if (!this.connected) {
        logger.warn('No hay conexión con el PLC. Intentando reconectar...');
        this.reconnect();
        return;
      }
      
      this.client.readAllItems((err: Error, values: any) => {
        if (err) {
          failedAttempts++;
          logger.error(`Error al leer datos del PLC (intento ${failedAttempts}/${MAX_FAILED_ATTEMPTS}):`, err);
          
          if (failedAttempts >= MAX_FAILED_ATTEMPTS) {
            logger.error('Demasiados errores consecutivos. Intentando reconectar...');
            this.connected = false;
            this.reconnect();
          }
          return;
        }
        
        // Resetear contador de intentos fallidos si la lectura fue exitosa
        failedAttempts = 0;
        
        // Procesar los valores leídos
        this.processValues(values);
      });
    }, this.config.cycleTime);
  }

  private processValues(values: any): void {
    // Verificar si hay valores válidos
    if (!values) {
      logger.warn('No se recibieron valores del PLC');
      return;
    }
    
    try {
      // Extraer valores relevantes para TLV1
      const tlv1Modo = values[this.variables['tlv1_modo']] !== undefined ? values[this.variables['tlv1_modo']] : 0;
      const tlv1Ocupacion = values[this.variables['tlv1_ocupacion']] === true;
      const tlv1Averia = values[this.variables['tlv1_averia']] === true;
      const tlv1CoordX = values[this.variables['tlv1_coord_x']] !== undefined ? values[this.variables['tlv1_coord_x']] : 0;
      const tlv1CoordY = values[this.variables['tlv1_coord_y']] !== undefined ? values[this.variables['tlv1_coord_y']] : 0;
      const tlv1CoordZ = values[this.variables['tlv1_coord_z']] !== undefined ? values[this.variables['tlv1_coord_z']] : 0;
      const tlv1Matricula = values[this.variables['tlv1_matricula']] !== undefined ? values[this.variables['tlv1_matricula']] : 0;
      const tlv1Pasillo = values[this.variables['tlv1_pasillo']] !== undefined ? values[this.variables['tlv1_pasillo']] : 0;
      const tlv1OrdenTipo = values[this.variables['tlv1_orden_tipo']] !== undefined ? values[this.variables['tlv1_orden_tipo']] : 0;
      const tlv1FinOrdenEstado = values[this.variables['tlv1_fin_orden_estado']] !== undefined ? values[this.variables['tlv1_fin_orden_estado']] : 0;
      const tlv1FinOrdenResultado = values[this.variables['tlv1_fin_orden_resultado']] !== undefined ? values[this.variables['tlv1_fin_orden_resultado']] : 0;
      
      // Determinar el estado del transelevador
      const tlv1Status = this.getTLV1Status(tlv1Modo, tlv1Ocupacion, tlv1Averia);
      
      // Crear componente para TLV1
      const tlv1Component: SiloComponent = {
        id: 'tlv1',
        name: 'Transelevador 1',
        type: 'transelevador',
        status: tlv1Status,
        state: {
          mode: this.getModoText(tlv1Modo),
          occupation: tlv1Ocupacion,
          error: tlv1Averia
        },
        position: {
          x: tlv1CoordX,
          y: tlv1CoordY,
          z: tlv1CoordZ,
          matricula: tlv1Matricula,
          pasillo: tlv1Pasillo
        },
        order: {
          type: this.getTipoOrdenText(tlv1OrdenTipo),
          finOrdenEstado: this.getFinOrdenEstadoText(tlv1FinOrdenEstado),
          finOrdenResultado: this.getFinOrdenResultadoText(tlv1FinOrdenResultado)
        }
      };
      
      // Actualizar componentes
      this.components = [tlv1Component];
      
      // Emitir evento de actualización
      this.emit('update', this.components);
      
    } catch (error) {
      logger.error('Error al procesar los valores del PLC:', error);
    }
  }

  private getTLV1Status(modo: number, ocupacion: boolean, averia: boolean): 'active' | 'inactive' | 'error' | 'moving' {
    if (averia) return 'error';
    if (ocupacion) return 'moving';
    if (modo === 0) return 'active'; // Automático
    return 'inactive';
  }

  private getModoText(modo: number): string {
    switch (modo) {
      case 0: return 'AUTOMÁTICO';
      case 1: return 'SEMIAUTOMÁTICO';
      case 2: return 'MANUAL';
      default: return 'DESCONOCIDO';
    }
  }

  private getTipoOrdenText(tipo: number): string {
    switch (tipo) {
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

  public getComponents(): SiloComponent[] {
    return this.components;
  }

  // Método para escribir en el PLC (para control manual)
  public async writePosition(componentId: string, position: { x?: number, y?: number, z?: number }): Promise<boolean> {
    if (!this.connected) {
      logger.error('No hay conexión con el PLC');
      return false;
    }

    // Solo permitir escritura para TLV1
    if (componentId !== 'tlv1') {
      logger.error(`Componente no soportado para escritura: ${componentId}`);
      return false;
    }

    const writeValues: Record<string, any> = {};

    // Añadir valores a escribir según lo que se haya especificado
    if (position.x !== undefined) writeValues[this.variables['tlv1_coord_x']] = position.x;
    if (position.y !== undefined) writeValues[this.variables['tlv1_coord_y']] = position.y;
    if (position.z !== undefined) writeValues[this.variables['tlv1_coord_z']] = position.z;

    return new Promise((resolve, reject) => {
      const addresses = Object.keys(writeValues);
      const values = Object.values(writeValues);
      
      if (addresses.length === 0) {
        resolve(false);
        return;
      }
      
      this.client.writeItems(addresses, values, (err: Error) => {
        if (err) {
          logger.error('Error al escribir posición:', err);
          reject(err);
          return;
        }
        logger.info('Posición actualizada correctamente');
        resolve(true);
      });
    });
  }

  // Método para enviar una orden al transelevador TLV1
  public async sendOrderToTLV1(order: {
    tipo: number,
    pasillo_origen?: number,
    coord_x_origen?: number,
    coord_y_origen?: number,
    coord_z_origen?: number,
    pasillo_destino?: number,
    coord_x_destino?: number,
    coord_y_destino?: number,
    coord_z_destino?: number,
    matricula?: number
  }): Promise<boolean> {
    if (!this.connected) {
      logger.error('No hay conexión con el PLC');
      return false;
    }

    const writeValues: Record<string, any> = {};

    // Escribir el tipo de orden (obligatorio)
    writeValues[this.variables['tlv1_orden_tipo']] = order.tipo;

    // Escribir los datos de origen si están definidos
    if (order.pasillo_origen !== undefined) writeValues[this.variables['tlv1_orden_pasillo_origen']] = order.pasillo_origen;
    if (order.coord_x_origen !== undefined) writeValues[this.variables['tlv1_orden_coord_x_origen']] = order.coord_x_origen;
    if (order.coord_y_origen !== undefined) writeValues[this.variables['tlv1_orden_coord_y_origen']] = order.coord_y_origen;
    if (order.coord_z_origen !== undefined) writeValues[this.variables['tlv1_orden_coord_z_origen']] = order.coord_z_origen;

    // Escribir los datos de destino si están definidos
    if (order.pasillo_destino !== undefined) writeValues[this.variables['tlv1_orden_pasillo_destino']] = order.pasillo_destino;
    if (order.coord_x_destino !== undefined) writeValues[this.variables['tlv1_orden_coord_x_destino']] = order.coord_x_destino;
    if (order.coord_y_destino !== undefined) writeValues[this.variables['tlv1_orden_coord_y_destino']] = order.coord_y_destino;
    if (order.coord_z_destino !== undefined) writeValues[this.variables['tlv1_orden_coord_z_destino']] = order.coord_z_destino;

    // Escribir la matrícula si está definida
    if (order.matricula !== undefined) writeValues[this.variables['tlv1_orden_matricula']] = order.matricula;

    return new Promise((resolve, reject) => {
      const addresses = Object.keys(writeValues);
      const values = Object.values(writeValues);
      
      if (addresses.length === 0) {
        resolve(false);
        return;
      }
      
      this.client.writeItems(addresses, values, (err: Error) => {
        if (err) {
          logger.error('Error al enviar orden al TLV1:', err);
          reject(err);
          return;
        }
        logger.info('Orden enviada correctamente al TLV1');
        resolve(true);
      });
    });
  }

  // Método para cambiar el modo del transelevador TLV1
  public async setTLV1Mode(mode: number): Promise<boolean> {
    if (!this.connected) {
      logger.error('No hay conexión con el PLC');
      return false;
    }

    return new Promise((resolve, reject) => {
      this.client.writeItems(this.variables['tlv1_modo'], mode, (err: Error) => {
        if (err) {
          logger.error('Error al cambiar el modo del TLV1:', err);
          reject(err);
          return;
        }
        logger.info(`Modo del TLV1 cambiado a: ${mode}`);
        resolve(true);
      });
    });
  }

  // Método para leer valores de variables específicas
  public async readItems(items: string[]): Promise<Record<string, any>> {
    if (!this.connected) {
      logger.warn('No hay conexión con el PLC');
      return {};
    }

    return new Promise((resolve, reject) => {
      this.client.readMultipleItems(items, (err: Error, values: Record<string, any>) => {
        if (err) {
          logger.error('Error al leer variables del PLC:', err);
          reject(err);
          return;
        }
        resolve(values);
      });
    });
  }

  // Método para leer todos los valores del DB101
  public async readAllItems(): Promise<Record<string, any>> {
    // Lista de variables a leer del DB101
    const variablesToRead = [
      'DB101,B0', 'DB101,X0.0', 'DB101,X0.1',  // Estado
      'DB101,W10', 'DB101,W12', 'DB101,W14', 'DB101,W16', 'DB101,B18',  // Coordenadas
      'DB101,B20', 'DB101,B22', 'DB101,B23', 'DB101,B24', 'DB101,B25',  // Orden en curso (origen)
      'DB101,B27', 'DB101,B28', 'DB101,B29', 'DB101,B30', 'DB101,W32',  // Orden en curso (destino y matrícula)
      'DB101,B40', 'DB101,B41', 'DB101,B42', 'DB101,B43', 'DB101,B44', 'DB101,B45'  // Fin de orden
    ];

    try {
      // Verificar si hay conexión con el PLC
      if (!this.connected) {
        logger.warn('No hay conexión con el PLC. Intentando reconectar...');
        try {
          await this.reconnect();
        } catch (reconnectError) {
          logger.error('Error al reconectar con el PLC:', reconnectError);
          return this.getDefaultValues(variablesToRead);
        }
      }

      // Intentar leer los valores del PLC directamente
      return new Promise<Record<string, any>>((resolve, reject) => {
        // Configurar un timeout para la operación de lectura
        const timeoutId = setTimeout(() => {
          logger.error('Timeout al leer variables del PLC');
          resolve(this.getDefaultValues(variablesToRead));
        }, 10000); // 10 segundos de timeout

        // Leer todos los valores registrados
        this.client.readAllItems((err: Error, values: Record<string, any>) => {
          // Cancelar el timeout ya que la operación completó
          clearTimeout(timeoutId);

          if (err) {
            logger.error('Error al leer variables del PLC:', err);
            // Si hay un error de conexión, intentar reconectar
            if (err.toString().includes('TCP') || err.toString().includes('connect')) {
              this.connected = false;
              logger.warn('Error de conexión detectado, se intentará reconectar en el próximo ciclo');
            }
            resolve(this.getDefaultValues(variablesToRead));
            return;
          }

          // Procesar los valores leídos
          const db101Variables: Record<string, any> = {};
          let hasValidValues = false;
          
          variablesToRead.forEach(variable => {
            if (values[variable] !== undefined && values[variable] !== null) {
              db101Variables[variable] = values[variable];
              hasValidValues = true;
            } else {
              // Si no se encontró el valor, asignar un valor por defecto
              if (variable.includes(',X')) {
                db101Variables[variable] = false;  // Valores booleanos
              } else {
                db101Variables[variable] = 0;      // Valores numéricos
              }
            }
          });

          if (!hasValidValues) {
            logger.warn('No se recibieron valores válidos del PLC, usando valores por defecto');
            resolve(this.getDefaultValues(variablesToRead));
            return;
          }

          // Mostrar algunos valores para depuración
          logger.info(`Valores leídos correctamente: Modo=${db101Variables['DB101,B0']}, X=${db101Variables['DB101,W10']}, Y=${db101Variables['DB101,W12']}, Z=${db101Variables['DB101,W14']}`);
          resolve(db101Variables);
        });
      });
    } catch (error) {
      logger.error('Error al leer valores del DB101:', error);
      return this.getDefaultValues(variablesToRead);
    }
  }

  // Método para escribir un valor en una dirección específica del DB101
  public async writeItem(address: string, value: any): Promise<boolean> {
    if (!this.connected) {
      logger.error('Intento de escritura sin conexión al PLC');
      return false;
    }

    return new Promise((resolve) => {
      try {
        // Verificar si la dirección es válida
        if (!address || !this.variables[address]) {
          logger.error(`Dirección inválida para escritura: ${address}`);
          resolve(false);
          return;
        }

        // Convertir el valor según el tipo de dato
        let convertedValue = value;
        if (typeof value === 'boolean') {
          convertedValue = value ? 1 : 0;
        } else if (typeof value === 'number') {
          // Asegurarse de que el valor sea un número entero para bytes
          if (address.includes(',B')) {
            convertedValue = Math.round(value);
          }
        }

        logger.info(`Intentando escribir en ${address} el valor ${convertedValue}`);

        // Escribir el valor
        this.client.writeItems(address, convertedValue, (err: Error) => {
          if (err) {
            logger.error(`Error al escribir en ${address}: ${err.message}`);
            // Si hay error de conexión, intentar reconectar
            if (err.message.includes('ECONNRESET') || err.message.includes('not connected')) {
              this.connected = false;
              this.reconnect();
            }
            resolve(false);
            return;
          }

          // Verificar que el valor se escribió correctamente
          this.client.readItems(address, (readErr: Error, readValue: any) => {
            if (readErr) {
              logger.error(`Error al verificar escritura en ${address}: ${readErr.message}`);
              resolve(false);
              return;
            }

            if (readValue[address] === convertedValue) {
              logger.info(`Valor escrito y verificado en ${address}: ${convertedValue}`);
              resolve(true);
            } else {
              logger.error(`Error de verificación en ${address}: esperado ${convertedValue}, leído ${readValue[address]}`);
              resolve(false);
            }
          });
        });
      } catch (error) {
        logger.error(`Error inesperado al escribir en ${address}:`, error);
        resolve(false);
      }
    });
  }

  // Método auxiliar para obtener valores por defecto
  private getDefaultValues(variables: string[]): Record<string, any> {
    logger.warn('Usando valores por defecto para el PLC');
    const defaultValues: Record<string, any> = {};
    
    // Asignar valores por defecto para todas las variables
    variables.forEach(variable => {
      if (variable.includes(',X')) {
        defaultValues[variable] = false;  // Valores booleanos
      } else {
        defaultValues[variable] = 0;      // Valores numéricos
      }
    });
    
    // Valores específicos para las variables principales (usando los valores reales que conocemos)
    defaultValues['DB101,B0'] = 1;      // Modo: SEMIAUTOMÁTICO
    defaultValues['DB101,X0.0'] = true; // Ocupación: OCUPADO
    defaultValues['DB101,X0.1'] = false; // Avería: OK
    defaultValues['DB101,W10'] = 0;     // Coordenada X
    defaultValues['DB101,W12'] = 0;     // Coordenada Y
    defaultValues['DB101,W14'] = 0;     // Coordenada Z
    defaultValues['DB101,B20'] = 1;     // Tipo orden: DEPÓSITO
    defaultValues['DB101,B40'] = 2;     // Estado fin orden: FIN DE ORDEN
    defaultValues['DB101,B41'] = 2;     // Resultado fin orden: OK EXTRACCIÓN
    
    return defaultValues;
  }

  public isConnected(): boolean {
    return this.connected;
  }
}

export default PLCService;
