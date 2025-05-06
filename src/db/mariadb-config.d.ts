/**
 * Declaración de tipos para mariadb-config.js
 */

export function query(sql: string, params?: any[]): Promise<any>;
export function getConnection(): Promise<any>;
export function closeConnection(): Promise<void>;
