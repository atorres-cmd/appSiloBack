// src/entities/TLV1Record.ts
import { Entity, Column, PrimaryGeneratedColumn, CreateDateColumn } from 'typeorm';

@Entity()
export class TLV1Record {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  timestamp!: Date;

  @Column({ type: 'integer', default: 0 })
  modo!: number;

  @Column({ type: 'integer', default: 0 })
  ocupacion!: number;

  @Column({ type: 'integer', default: 0 })
  averia!: number;

  @Column({ type: 'integer', default: 0 })
  coord_x!: number;

  @Column({ type: 'integer', default: 0 })
  coord_y!: number;

  @Column({ type: 'integer', default: 0 })
  coord_z!: number;

  @Column({ type: 'integer', default: 0 })
  matricula!: number;

  @Column({ type: 'integer', default: 0 })
  pasillo!: number;

  @Column({ type: 'integer', default: 0 })
  tipo_orden!: number;

  @Column({ type: 'integer', default: 0, nullable: true })
  fin_orden_estado!: number;

  @Column({ type: 'integer', default: 0, nullable: true })
  fin_orden_resultado!: number;
}
