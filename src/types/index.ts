// src/types/index.ts

export interface PLCConfig {
    ip: string;
    rack: number;
    slot: number;
    cycleTime: number; // ms
    connectionTimeout?: number; // ms
    maxRetries?: number;
    retryInterval?: number; // ms
    keepAliveInterval?: number; // ms
  }
  
  export type ComponentStatus = "active" | "inactive" | "error" | "moving";
  
  export interface SiloComponent {
    id: string;
    name: string;
    type: "transelevador" | "transferidor" | "puente" | "elevador";
    status: ComponentStatus;
    state?: {
      mode?: string;
      occupation?: boolean;
      error?: boolean;
    };
    position: {
      x: number;
      y: number;
      z?: number;
      pasillo?: number;
      matricula?: number;
    };
    order?: {
      type?: string;
      finOrdenEstado?: string;
      finOrdenResultado?: string;
    };
  }
  
  export interface PLCVariableMap {
    [key: string]: string;
  }

  export interface PLCServiceInterface {
    connect(): Promise<boolean>;
    disconnect(): void;
    writeItem(address: string, value: any): Promise<boolean>;
    readItems(items: string[]): Promise<Record<string, any>>;
    readAllItems(): Promise<Record<string, any>>;
    isConnected(): boolean;
  }

  export interface Coordinates {
    x: number;
    y: number;
    z: number;
    theta: number;
  }

  export interface Order {
    type: number;
    priority: number;
    coordinates: Coordinates;
  }