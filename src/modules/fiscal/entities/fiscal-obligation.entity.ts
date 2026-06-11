import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ObligationType {
  DAS = 'DAS',
  DASN = 'DASN',
}

export enum ObligationStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

@Entity('fiscal_obligations')
export class FiscalObligation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  companyId!: string | null;

  @Column({
    type: 'enum',
    enum: ObligationType,
    enumName: 'obligation_type_enum',
  })
  type!: ObligationType;

  @Column({ type: 'varchar', length: 7 })
  referencePeriod!: string;

  @Column({ type: 'timestamptz' })
  dueDate!: Date;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @Column({
    type: 'enum',
    enum: ObligationStatus,
    enumName: 'obligation_status_enum',
    default: ObligationStatus.PENDING,
  })
  status!: ObligationStatus;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt!: Date | null;

  @Column({ type: 'varchar', length: 48, nullable: true })
  barcode!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
