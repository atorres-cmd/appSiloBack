// src/config/plcSymbols.ts
// Tabla de símbolos para los transelevadores TLV1 y TLV2

// Interfaz para la definición de variables simbólicas
export interface SymbolDefinition {
  address: string;      // Dirección absoluta (DB101,B0, etc.)
  dataType: string;     // Tipo de dato (BYTE, WORD, BOOL, etc.)
  description: string;  // Descripción de la variable
  device: string;       // Dispositivo al que pertenece (TLV1, TLV2)
  defaultValue?: any;   // Valor por defecto para simulación
}

// Interfaz para los valores posibles de campos enumerados
export interface EnumValue {
  value: number | boolean;
  description: string;
}

// Interfaz para la definición de campos enumerados
export interface EnumDefinition {
  symbol: string;
  values: Record<number | string, string>;
}

// Tabla de símbolos para el TLV1 (DB101)
export const tlv1SymbolTable: Record<string, SymbolDefinition> = {
  // Estado del transelevador
  'TLV1.MODO': {
    address: 'DB101,B0',
    dataType: 'BYTE',
    description: 'Modo de operación (0: AUTOMÁTICO, 1: SEMIAUTOMÁTICO, 2: MANUAL)',
    device: 'TLV1',
    defaultValue: 1
  },
  'TLV1.OCUPACION': {
    address: 'DB101,X0.0',
    dataType: 'BOOL',
    description: 'Estado de ocupación (false: LIBRE, true: OCUPADO)',
    device: 'TLV1',
    defaultValue: false
  },
  'TLV1.AVERIA': {
    address: 'DB101,X0.1',
    dataType: 'BOOL',
    description: 'Estado de avería (false: OK, true: AVERÍA)',
    device: 'TLV1',
    defaultValue: false
  },
  
  // Coordenadas actuales
  'TLV1.COORD_X': {
    address: 'DB101,W10',
    dataType: 'WORD',
    description: 'Coordenada X actual',
    device: 'TLV1',
    defaultValue: 0
  },
  'TLV1.COORD_Y': {
    address: 'DB101,W12',
    dataType: 'WORD',
    description: 'Coordenada Y actual',
    device: 'TLV1',
    defaultValue: 0
  },
  'TLV1.COORD_Z': {
    address: 'DB101,W14',
    dataType: 'WORD',
    description: 'Coordenada Z actual',
    device: 'TLV1',
    defaultValue: 0
  },
  'TLV1.MATRICULA': {
    address: 'DB101,W16',
    dataType: 'WORD',
    description: 'Matrícula actual',
    device: 'TLV1',
    defaultValue: 12345
  },
  'TLV1.PASILLO': {
    address: 'DB101,B18',
    dataType: 'BYTE',
    description: 'Pasillo actual',
    device: 'TLV1',
    defaultValue: 1
  },
  
  // Orden en curso
  'TLV1.ORDEN.TIPO': {
    address: 'DB101,B20',
    dataType: 'BYTE',
    description: 'Tipo de orden (0: SIN ORDEN, 1: DEPÓSITO, 2: EXTRACCIÓN, etc.)',
    device: 'TLV1',
    defaultValue: 2
  },
  
  // Origen
  'TLV1.ORIGEN.PASILLO': {
    address: 'DB101,B22',
    dataType: 'BYTE',
    description: 'Pasillo de origen',
    device: 'TLV1',
    defaultValue: 1
  },
  'TLV1.ORIGEN.X': {
    address: 'DB101,B23',
    dataType: 'BYTE',
    description: 'Coordenada X de origen',
    device: 'TLV1',
    defaultValue: 10
  },
  'TLV1.ORIGEN.Y': {
    address: 'DB101,B24',
    dataType: 'BYTE',
    description: 'Coordenada Y de origen',
    device: 'TLV1',
    defaultValue: 20
  },
  'TLV1.ORIGEN.Z': {
    address: 'DB101,B25',
    dataType: 'BYTE',
    description: 'Coordenada Z de origen',
    device: 'TLV1',
    defaultValue: 1
  },
  
  // Destino
  'TLV1.DESTINO.PASILLO': {
    address: 'DB101,B27',
    dataType: 'BYTE',
    description: 'Pasillo de destino',
    device: 'TLV1',
    defaultValue: 2
  },
  'TLV1.DESTINO.X': {
    address: 'DB101,B28',
    dataType: 'BYTE',
    description: 'Coordenada X de destino',
    device: 'TLV1',
    defaultValue: 15
  },
  'TLV1.DESTINO.Y': {
    address: 'DB101,B29',
    dataType: 'BYTE',
    description: 'Coordenada Y de destino',
    device: 'TLV1',
    defaultValue: 25
  },
  'TLV1.DESTINO.Z': {
    address: 'DB101,B30',
    dataType: 'BYTE',
    description: 'Coordenada Z de destino',
    device: 'TLV1',
    defaultValue: 2
  },
  'TLV1.ORDEN.MATRICULA': {
    address: 'DB101,W32',
    dataType: 'WORD',
    description: 'Matrícula de la orden',
    device: 'TLV1',
    defaultValue: 54321
  },
  
  // Fin de orden
  'TLV1.FIN_ORDEN.ESTADO': {
    address: 'DB101,B40',
    dataType: 'BYTE',
    description: 'Estado de fin de orden (0: SIN ORDEN, 1: EN CURSO, 2: FIN DE ORDEN, etc.)',
    device: 'TLV1',
    defaultValue: 2
  },
  'TLV1.FIN_ORDEN.RESULTADO': {
    address: 'DB101,B41',
    dataType: 'BYTE',
    description: 'Resultado de fin de orden (0: OK DEPÓSITO, 2: OK EXTRACCIÓN, etc.)',
    device: 'TLV1',
    defaultValue: 2
  },
  'TLV1.FIN_ORDEN.DESTINO.PASILLO': {
    address: 'DB101,B42',
    dataType: 'BYTE',
    description: 'Pasillo de destino final',
    device: 'TLV1',
    defaultValue: 2
  },
  'TLV1.FIN_ORDEN.DESTINO.X': {
    address: 'DB101,B43',
    dataType: 'BYTE',
    description: 'Coordenada X de destino final',
    device: 'TLV1',
    defaultValue: 15
  },
  'TLV1.FIN_ORDEN.DESTINO.Y': {
    address: 'DB101,B44',
    dataType: 'BYTE',
    description: 'Coordenada Y de destino final',
    device: 'TLV1',
    defaultValue: 25
  },
  'TLV1.FIN_ORDEN.DESTINO.Z': {
    address: 'DB101,B45',
    dataType: 'BYTE',
    description: 'Coordenada Z de destino final',
    device: 'TLV1',
    defaultValue: 2
  }
};

// Tabla de valores enumerados
export const enumValues: Record<string, Record<number | string, string>> = {
  'TLV1.MODO': {
    0: 'AUTOMÁTICO',
    1: 'SEMIAUTOMÁTICO',
    2: 'MANUAL'
  },
  'TLV1.ORDEN.TIPO': {
    0: 'SIN ORDEN',
    1: 'DEPÓSITO',
    2: 'EXTRACCIÓN',
    3: 'CAMBIO PASILLO',
    4: 'TRASVASE',
    5: 'TEST'
  },
  'TLV1.FIN_ORDEN.ESTADO': {
    0: 'SIN ORDEN',
    1: 'EN CURSO',
    2: 'FIN DE ORDEN',
    4: 'ESTADO ESPECIAL'
  },
  'TLV1.FIN_ORDEN.RESULTADO': {
    0: 'OK DEPÓSITO',
    2: 'OK EXTRACCIÓN',
    3: 'ERROR DEPÓSITO',
    4: 'ERROR EXTRACCIÓN',
    5: 'OK TRASVASE',
    6: 'ABORTADO'
  },
  'TLV2.MODO': {
    0: 'AUTOMÁTICO',
    1: 'SEMIAUTOMÁTICO',
    2: 'MANUAL'
  },
  'TLV2.ORDEN.TIPO': {
    0: 'SIN ORDEN',
    1: 'DEPÓSITO',
    2: 'EXTRACCIÓN',
    3: 'CAMBIO PASILLO',
    4: 'TRASVASE',
    5: 'TEST'
  },
  'TLV2.FIN_ORDEN.ESTADO': {
    0: 'SIN ORDEN',
    1: 'EN CURSO',
    2: 'FIN DE ORDEN'
  },
  'TLV2.FIN_ORDEN.RESULTADO': {
    0: 'OK DEPÓSITO',
    2: 'OK EXTRACCIÓN',
    3: 'ERROR DEPÓSITO',
    4: 'ERROR EXTRACCIÓN',
    5: 'OK TRASVASE',
    6: 'ABORTADO'
  },
  'TLV2.ORIGEN.Z': {
    1: 'IZQUIERDA',
    2: 'DERECHA'
  },
  'TLV2.DESTINO.Z': {
    1: 'IZQUIERDA',
    2: 'DERECHA'
  }
};

// Combinar ambas tablas de símbolos
export const allSymbols = { ...tlv1SymbolTable };

// Función para obtener todos los símbolos de un dispositivo específico
export function getSymbolsByDevice(device: string): Record<string, SymbolDefinition> {
  const result: Record<string, SymbolDefinition> = {};
  
  for (const [symbolName, symbol] of Object.entries(allSymbols)) {
    if (symbol.device === device) {
      result[symbolName] = symbol;
    }
  }
  
  return result;
}

// Función para obtener la dirección absoluta a partir del nombre simbólico
export function getAddressFromSymbol(symbolName: string): string | null {
  const symbol = allSymbols[symbolName];
  return symbol ? symbol.address : null;
}

// Función para obtener el nombre simbólico a partir de la dirección absoluta
export function getSymbolFromAddress(address: string): string | null {
  for (const [symbolName, symbol] of Object.entries(allSymbols)) {
    if (symbol.address === address) {
      return symbolName;
    }
  }
  return null;
}

// Función para obtener todas las direcciones absolutas
export function getAllAddresses(): string[] {
  return Object.values(allSymbols).map(symbol => symbol.address);
}

// Función para obtener todas las direcciones absolutas de un dispositivo específico
export function getAddressesByDevice(device: string): string[] {
  return Object.values(allSymbols)
    .filter(symbol => symbol.device === device)
    .map(symbol => symbol.address);
}

// Función para obtener todos los nombres simbólicos
export function getAllSymbols(): string[] {
  return Object.keys(allSymbols);
}

// Función para obtener todos los nombres simbólicos de un dispositivo específico
export function getSymbolNamesByDevice(device: string): string[] {
  return Object.entries(allSymbols)
    .filter(([_, symbol]) => symbol.device === device)
    .map(([symbolName, _]) => symbolName);
}

// Función para convertir un objeto con claves de direcciones absolutas a claves simbólicas
export function convertToSymbolicKeys(values: Record<string, any>, device?: string): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [address, value] of Object.entries(values)) {
    const symbolName = getSymbolFromAddress(address);
    if (symbolName) {
      // Si se especifica un dispositivo, filtrar solo los símbolos de ese dispositivo
      const symbol = allSymbols[symbolName];
      if (!device || symbol.device === device) {
        result[symbolName] = value;
      }
    } else {
      // Mantener la dirección original si no hay un símbolo correspondiente
      result[address] = value;
    }
  }
  
  return result;
}

// Función para convertir un objeto con claves simbólicas a claves de direcciones absolutas
export function convertToAbsoluteKeys(values: Record<string, any>): Record<string, any> {
  const result: Record<string, any> = {};
  
  for (const [symbolName, value] of Object.entries(values)) {
    const address = getAddressFromSymbol(symbolName);
    if (address) {
      result[address] = value;
    } else {
      // Mantener el nombre simbólico original si no hay una dirección correspondiente
      result[symbolName] = value;
    }
  }
  
  return result;
}

// Función para obtener la descripción de un valor enumerado
export function getEnumDescription(symbolName: string, value: number | boolean): string {
  const enumDef = enumValues[symbolName];
  if (!enumDef) return 'DESCONOCIDO';
  
  // Convertir booleanos a 0/1 para buscar en la tabla de enumeraciones
  const lookupValue = typeof value === 'boolean' ? (value ? 1 : 0) : value;
  
  return enumDef[lookupValue] || 'DESCONOCIDO';
}

// Función para obtener valores simulados para un dispositivo específico
export function getSimulatedValues(device: string): Record<string, any> {
  const result: Record<string, any> = {};
  const symbols = getSymbolsByDevice(device);
  
  for (const [symbolName, symbol] of Object.entries(symbols)) {
    if (symbol.defaultValue !== undefined) {
      result[symbol.address] = symbol.defaultValue;
    }
  }
  
  return result;
}
