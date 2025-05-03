import { DataSource } from 'typeorm';
import { TLV1Record } from '../entities/TLV1Record';

export class DataStorageService {
  private dataSource: DataSource;

  constructor(dataSource: DataSource) {
    this.dataSource = dataSource;
  }

  // Devuelve los últimos registros de TLV1 (por defecto, el más reciente)
  async getLatestTLV1Records(limit: number = 1): Promise<TLV1Record[]> {
    const repo = this.dataSource.getRepository(TLV1Record);
    return repo.find({
      order: { timestamp: 'DESC' },
      take: limit
    });
  }
} 