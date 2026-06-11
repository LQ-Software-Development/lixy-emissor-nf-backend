import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum InvoiceStatus {
  ISSUED = 'issued',
  CANCELLED = 'cancelled',
}

@Entity('invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid', nullable: true })
  clientId!: string | null;

  @Column({ type: 'varchar', length: 50 })
  number!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  description!: string | null;

  @Column({
    type: 'enum',
    enum: InvoiceStatus,
    default: InvoiceStatus.ISSUED,
  })
  status!: InvoiceStatus;

  @Column({ type: 'timestamptz' })
  issuedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
