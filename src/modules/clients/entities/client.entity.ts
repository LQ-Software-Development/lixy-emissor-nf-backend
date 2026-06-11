import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import type { DocumentType } from '../../../common/validators/is-cpf-or-cnpj.validator';

@Entity('clients')
@Index(['organizationId', 'document'], { unique: true })
export class ClientEntity {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'organization_id' })
  organizationId!: string;

  @Column()
  name!: string;

  @Column({ length: 14 })
  document!: string;

  @Column({ name: 'document_type', type: 'varchar', length: 4 })
  documentType!: DocumentType;

  @Column({ nullable: true })
  email!: string | null;

  @Column({ nullable: true, length: 20 })
  phone!: string | null;

  @Column({ length: 8 })
  cep!: string;

  @Column()
  street!: string;

  @Column({ nullable: true })
  number!: string | null;

  @Column({ nullable: true })
  complement!: string | null;

  @Column()
  neighborhood!: string;

  @Column()
  city!: string;

  @Column({ length: 2 })
  state!: string;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;
}
