import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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
export class FiscalObligationRef {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  companyId!: string;

  @Column({ type: 'varchar', length: 10 })
  type!: FiscalObligationType;

  @Column({ type: 'varchar', length: 20 })
  referencePeriod!: string;

  @Column({ type: 'date' })
  dueDate!: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount!: string;

  @Column({ type: 'varchar', length: 20 })
  status!: FiscalObligationStatus;

  @Column({ type: 'varchar', length: 48, nullable: true })
  barcode!: string | null;
}
