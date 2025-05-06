const { query } = require('../db/mariadb-config');
const nodes7 = require('nodes7');
require('dotenv').config();

class TLV2MariaDBController {
  constructor() {
    this.conn = new nodes7();
    this.isConnected = false;
    this.isReading = false;
    this.syncInterval = null;
    this.syncIntervalTime = 30000; // 30 segundos por defecto
    this.plcIp = process.env.PLC_IP || '10.21.178.100';
    this.plcRack = parseInt(process.env.PLC_RACK || '0');
    this.plcSlot = parseInt(process.env.PLC_SLOT || '3');
    this.variables = {
      'DB102,B0': 'modo',
      'DB102,B1': 'ocupacion',
      'DB102,B2': 'averia',
      'DB102,W32': 'matricula', // Usando W32 para la matrícula, igual que en DB101
      'DB102,B18': 'pasillo_actual',
      'DB102,W10': 'x_actual',
      'DB102,W12': 'y_actual',
      'DB102,W14': 'z_actual',
      'DB102,B40': 'estadoFinOrden',
      'DB102,B41': 'resultadoFinOrden'
    };
  }

  async connectToPLC() {
    return new Promise((resolve, reject) => {
      if (this.isConnected) {
        console.log('Ya conectado al PLC');
        resolve(true);
        return;
      }

      const connectionParams = {
        host: this.plcIp,
        port: 102,
        rack: this.plcRack,
        slot: this.plcSlot
      };

      this.conn.initiateConnection(connectionParams, (err) => {
        if (err) {
          console.error('Error al conectar con el PLC:', err);
          this.isConnected = false;
          reject(err);
          return;
        }

        console.log('Conexión establecida con el PLC');
        this.isConnected = true;

        // Añadir variables a leer
        const varsToRead = Object.keys(this.variables);
        this.conn.addItems(varsToRead);

        resolve(true);
      });
    });
  }

  async readPLCData() {
    return new Promise((resolve, reject) => {
      if (!this.isConnected) {
        reject(new Error('No hay conexión con el PLC'));
        return;
      }

      if (this.isReading) {
        reject(new Error('Ya se está leyendo datos del PLC'));
        return;
      }

      this.isReading = true;

      this.conn.readAllItems((err, data) => {
        this.isReading = false;

        if (err) {
          console.error('Error al leer datos del PLC:', err);
          reject(err);
          return;
        }

        console.log('Datos leídos del PLC:', data);
        resolve(data);
      });
    });
  }

  convertPLCDataToDBFormat(plcData) {
    return {
      modo: plcData['DB102,B0'] !== undefined ? plcData['DB102,B0'] : 0,
      ocupacion: plcData['DB102,B1'] !== undefined ? plcData['DB102,B1'] : 0,
      averia: plcData['DB102,B2'] !== undefined ? plcData['DB102,B2'] : 0,
      matricula: plcData['DB102,W32'] !== undefined ? plcData['DB102,W32'] : 0,
      pasillo_actual: plcData['DB102,B18'] !== undefined ? plcData['DB102,B18'] : 0,
      x_actual: plcData['DB102,W10'] !== undefined ? plcData['DB102,W10'] : 0,
      y_actual: plcData['DB102,W12'] !== undefined ? plcData['DB102,W12'] : 0,
      z_actual: plcData['DB102,W14'] !== undefined ? plcData['DB102,W14'] : 0,
      estadoFinOrden: plcData['DB102,B40'] !== undefined ? plcData['DB102,B40'] : 0,
      resultadoFinOrden: plcData['DB102,B41'] !== undefined ? plcData['DB102,B41'] : 0
    };
  }

  async saveToDatabase(data) {
    try {
      const sql = `
        INSERT INTO TLV2_Status 
        (modo, ocupacion, averia, matricula, pasillo_actual, x_actual, y_actual, z_actual, estadoFinOrden, resultadoFinOrden)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      
      const params = [
        data.modo,
        data.ocupacion,
        data.averia,
        data.matricula,
        data.pasillo_actual,
        data.x_actual,
        data.y_actual,
        data.z_actual,
        data.estadoFinOrden,
        data.resultadoFinOrden
      ];
      
      const result = await query(sql, params);
      console.log('Datos guardados en la base de datos:', result);
      return result;
    } catch (error) {
      console.error('Error al guardar datos en la base de datos:', error);
      throw error;
    }
  }

  async syncPLCToDatabase() {
    try {
      await this.connectToPLC();
      const plcData = await this.readPLCData();
      const dbData = this.convertPLCDataToDBFormat(plcData);
      await this.saveToDatabase(dbData);
      return { success: true, message: 'Sincronización completada' };
    } catch (error) {
      console.error('Error en la sincronización:', error);
      return { success: false, message: error.message };
    }
  }

  startAutoSync(intervalTime = null) {
    if (intervalTime) {
      this.syncIntervalTime = intervalTime;
    }

    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.syncPLCToDatabase()
        .then(result => {
          console.log('Auto-sincronización completada:', result);
        })
        .catch(error => {
          console.error('Error en auto-sincronización:', error);
        });
    }, this.syncIntervalTime);

    console.log(`Auto-sincronización iniciada con intervalo de ${this.syncIntervalTime}ms`);
    return { success: true, message: `Auto-sincronización iniciada con intervalo de ${this.syncIntervalTime}ms` };
  }

  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('Auto-sincronización detenida');
      return { success: true, message: 'Auto-sincronización detenida' };
    }
    return { success: false, message: 'No hay auto-sincronización activa' };
  }

  getAutoSyncStatus() {
    return {
      active: this.syncInterval !== null,
      intervalTime: this.syncIntervalTime,
      plcConnected: this.isConnected
    };
  }

  async disconnectFromPLC() {
    return new Promise((resolve) => {
      if (!this.isConnected) {
        resolve({ success: true, message: 'No hay conexión activa con el PLC' });
        return;
      }

      this.conn.dropConnection(() => {
        this.isConnected = false;
        console.log('Desconectado del PLC');
        resolve({ success: true, message: 'Desconectado del PLC' });
      });
    });
  }

  async getLatestData() {
    try {
      const sql = 'SELECT * FROM TLV2_Status ORDER BY timestamp DESC LIMIT 1';
      const result = await query(sql);
      return result[0] || null;
    } catch (error) {
      console.error('Error al obtener los últimos datos:', error);
      throw error;
    }
  }

  async getHistoricalData(limit = 10) {
    try {
      const sql = 'SELECT * FROM TLV2_Status ORDER BY timestamp DESC LIMIT ?';
      const result = await query(sql, [limit]);
      return result;
    } catch (error) {
      console.error('Error al obtener datos históricos:', error);
      throw error;
    }
  }
}

module.exports = new TLV2MariaDBController();
