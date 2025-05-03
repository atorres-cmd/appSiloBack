// src/config/plcConfig.ts
import { PLCConfig } from '../types';

// Configuración para el PLC Siemens S7-400
export const plcConfig: PLCConfig = {
  ip: '10.21.178.100',
  rack: 0,
  slot: 3, // Slot 3 confirmado funcionando con el PLC Siemens S7-400
  cycleTime: 1000, // Aumentado a 1 segundo para reducir la carga
  connectionTimeout: 10000, // 10 segundos para el timeout de conexión
  maxRetries: 3, // Reducido a 3 intentos para evitar ciclos largos de reconexión
  retryInterval: 2000, // 2 segundos entre intentos de reconexión
  keepAliveInterval: 5000 // 5 segundos para mantener la conexión viva
};

// Mapa de variables del PLC S7-400 (direcciones)
export const plcVariables = {
  // Variables del Transelevador TLV1 - Usando DB101
  // Estado del transelevador
  'tlv1_modo': 'DB101,B0', // 0=AUTOMÁTICO 1=SEMIAUTOMÁTICO 2=MANUAL
  'tlv1_ocupacion': 'DB101,X0.0', // false=LIBRE true=OCUPADO
  'tlv1_averia': 'DB101,X0.1', // false=OK true=AVERIA
  
  // Coordenadas actuales
  'tlv1_coord_x': 'DB101,W10', // Coordenada X actual
  'tlv1_coord_y': 'DB101,W12', // Coordenada Y actual
  'tlv1_coord_z': 'DB101,W14', // Coordenada Z actual
  'tlv1_matricula': 'DB101,W16', // Matrícula actual
  'tlv1_pasillo': 'DB101,B18', // Pasillo actual
  
  // Datos de orden en curso
  'tlv1_orden_tipo': 'DB101,B20', // 0=SIN ORDEN 1=DEPÓSITO 2=EXTRACCIÓN 3=CAMBIO PASILLO 4=TRASVASE 5=TEST
  'tlv1_orden_pasillo_origen': 'DB101,B22', // Pasillo origen
  'tlv1_orden_coord_x_origen': 'DB101,B23', // Coordenada X origen
  'tlv1_orden_coord_y_origen': 'DB101,B24', // Coordenada Y origen
  'tlv1_orden_coord_z_origen': 'DB101,B25', // Coordenada Z origen (1=IZQUIERDA 2=DERECHA)
  'tlv1_orden_pasillo_destino': 'DB101,B27', // Pasillo destino
  'tlv1_orden_coord_x_destino': 'DB101,B28', // Coordenada X destino
  'tlv1_orden_coord_y_destino': 'DB101,B29', // Coordenada Y destino
  'tlv1_orden_coord_z_destino': 'DB101,B30', // Coordenada Z destino (1=IZQUIERDA 2=DERECHA)
  'tlv1_orden_matricula': 'DB101,W32', // Matrícula
  
  // Fin de orden
  'tlv1_fin_orden_estado': 'DB101,B40', // 0=SIN ORDEN 1=EN CURSO 2=FIN DE ORDEN
  'tlv1_fin_orden_resultado': 'DB101,B41', // 0=OK DEP. 2=OK EXT. 3=ERROR DEP. 4=ERROR EXT. 5=OK TRANS. 6=ABORTADO
  'tlv1_fin_orden_pasillo_destino': 'DB101,B42', // Pasillo destino final
  'tlv1_fin_orden_coord_x_destino': 'DB101,B43', // Coordenada X destino final
  'tlv1_fin_orden_coord_y_destino': 'DB101,B44', // Coordenada Y destino final
  'tlv1_fin_orden_coord_z_destino': 'DB101,B45', // Coordenada Z destino final (1=IZQUIERDA 2=DERECHA)
};