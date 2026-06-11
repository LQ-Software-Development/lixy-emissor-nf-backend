import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum PushPlatform {
  ANDROID = 'android',
  IOS = 'ios',
  WEB = 'web',
}

@Entity('push_tokens')
@Index(['userId', 'token'], { unique: true })
export class PushToken {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 512 })
  token!: string;

  @Column({
    type: 'enum',
    enum: PushPlatform,
    enumName: 'push_platform_enum',
  })
  platform!: PushPlatform;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
