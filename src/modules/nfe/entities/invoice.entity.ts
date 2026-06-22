import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum NfeInvoiceStatus {
  DRAFT = 'draft',
  ISSUED = 'issued',
  CANCELLED = 'cancelled',
}

@Entity('nfe_invoices')
export class Invoice {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 9 })
  number!: string;

  @Column({ type: 'varchar', length: 3, default: '1' })
  series!: string;

  @Column({ type: 'uuid', nullable: true })
  clientId!: string | null;

  @Column({ type: 'varchar', length: 500 })
  description!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @Column({
    type: 'enum',
    enum: NfeInvoiceStatus,
    default: NfeInvoiceStatus.DRAFT,
  })
  status!: NfeInvoiceStatus;

  @Column({ type: 'varchar', length: 44, nullable: true })
  accessKey!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  issuedAt!: Date | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
