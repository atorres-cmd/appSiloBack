// src/config/database.ts
import { DataSource } from 'typeorm';
import { TLV1Record } from '../entities/TLV1Record';
import path from 'path';

// Configuración de la base de datos SQLite
export const AppDataSource = new DataSource({
  type: 'sqlite',
  database: path.join(__dirname, '../../tlv_data.sqlite'),
  entities: [TLV1Record],
  synchronize: true, // En producción, esto debería ser false y usar migraciones
  logging: false
});

// Función para inicializar la base de datos
export const initializeDatabase = async (): Promise<void> => {
  try {
    await AppDataSource.initialize();
    console.log('Base de datos SQLite inicializada correctamente');
  } catch (error) {
    console.error('Error al inicializar la base de datos:', error);
    throw error;
  }
};
