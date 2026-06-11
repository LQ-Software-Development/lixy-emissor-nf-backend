import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum FiscalObligationType {
  DAS = 'das',
  DASN = 'dasn',
}

export enum FiscalObligationStatus {
  PENDING = 'pending',
  PAID = 'paid',
  OVERDUE = 'overdue',
}

@Entity('fiscal_obligations')
export class FiscalObligationEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column({ type: 'enum', enum: FiscalObligationType })
  type!: FiscalObligationType;

  @Column({ length: 7 })
  period!: string;

  @Column({
    type: 'enum',
    enum: FiscalObligationStatus,
    default: FiscalObligationStatus.PENDING,
  })
  status!: FiscalObligationStatus;

  @Column({ name: 'due_date', type: 'date' })
  dueDate!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  amount!: string;

  @Column({ name: 'paid_at', type: 'timestamptz', nullable: true })
  paidAt!: Date | null;

  @Column({ name: 'payment_reference', type: 'varchar', nullable: true })
  paymentReference!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
