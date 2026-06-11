import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum ClientType {
  PF = 'PF',
  PJ = 'PJ',
}

@Entity('clients')
export class Client {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @Column({ type: 'varchar', length: 18, unique: true })
  document!: string;

  @Column({
    type: 'enum',
    enum: ClientType,
    enumName: 'client_type_enum',
  })
  type!: ClientType;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  phone!: string | null;

  @Column({ type: 'varchar', length: 9 })
  zipCode!: string;

  @Column({ type: 'varchar', length: 255 })
  street!: string;

  @Column({ type: 'varchar', length: 20 })
  number!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  complement!: string | null;

  @Column({ type: 'varchar', length: 255 })
  neighborhood!: string;

  @Column({ type: 'varchar', length: 255 })
  city!: string;

  @Column({ type: 'varchar', length: 2 })
  state!: string;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
