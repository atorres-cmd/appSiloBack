import { DataSource } from 'typeorm';
import { TLV1Record } from '../entities/TLV1Record';
const nodes7 = require('nodes7');

export class TLV1StorageService {
  private dataSource: DataSource;
  private interval: NodeJS.Timeout | null = null;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  public start(intervalMs: number = 2000) {
    if (this.interval) return;
    this.interval = setInterval(() => this.readAndStore(), intervalMs);
    console.log(`[TLV1StorageService] Servicio iniciado (cada ${intervalMs} ms)`);
  }

  public stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
      console.log('[TLV1StorageService] Servicio detenido');
    }
  }

  private async readAndStore() {
    const conn = new nodes7();
    const connectionParams = {
      host: process.env.PLC_IP || '10.21.178.100',
      port: 102,
      rack: parseInt(process.env.PLC_RACK || '0'),
      slot: parseInt(process.env.PLC_SLOT || '3'),
      timeout: 5000
    };
    const addresses = [
      'DB101,B0', 'DB101,B1', 'DB101,B2', 'DB101,W10', 'DB101,W12', 'DB101,W14', 'DB101,W16',
      'DB101,B18', 'DB101,B20', 'DB101,B40', 'DB101,B41'
    ];
    try {
      await new Promise<void>((resolve, reject) => {
        conn.initiateConnection(connectionParams, (err: any) => {
          if (err) return reject(err);
          conn.addItems(addresses);
          conn.readAllItems(async (err: any, values: Record<string, any>) => {
            conn.dropConnection(() => {});
            if (err) return reject(err);
            try {
              const repo = this.dataSource.getRepository(TLV1Record);
              const record = repo.create({
                modo: values['DB101,B0'],
                ocupacion: values['DB101,B1'],
                averia: values['DB101,B2'],
                coord_x: values['DB101,W10'],
                coord_y: values['DB101,W12'],
                coord_z: values['DB101,W14'],
                matricula: values['DB101,W16'],
                pasillo: values['DB101,B18'],
                tipo_orden: values['DB101,B20'],
                fin_orden_estado: values['DB101,B40'],
                fin_orden_resultado: values['DB101,B41']
              });
              await repo.save(record);
              console.log('[TLV1StorageService] Registro guardado:', record);
            } catch (saveErr) {
              console.error('[TLV1StorageService] Error al guardar registro:', saveErr);
            }
            resolve();
          });
        });
      });
    } catch (err) {
      console.error('[TLV1StorageService] Error al leer/guardar datos del PLC:', err);
    }
  }
} 