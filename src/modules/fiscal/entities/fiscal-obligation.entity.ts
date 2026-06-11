import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FiscalObligationType {
  DAS = 'DAS',
  DASN = 'DASN',
}

export enum FiscalObligationStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

@Entity('fiscal_obligations')
@Index(['companyId', 'dueDate'])
@Index(['companyId', 'status'])
export class FiscalObligation {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Index()
  @Column({ type: 'varchar', length: 255 })
  companyId: string;

  @Column({ type: 'enum', enum: FiscalObligationType })
  type: FiscalObligationType;

  @Column({ type: 'varchar', length: 20 })
  referencePeriod: string;

  @Column({ type: 'date' })
  dueDate: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: string;

  @Column({
    type: 'enum',
    enum: FiscalObligationStatus,
    default: FiscalObligationStatus.PENDING,
  })
  status: FiscalObligationStatus;

  @Column({ type: 'timestamp with time zone', nullable: true })
  paidAt: Date | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
