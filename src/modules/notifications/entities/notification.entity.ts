import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export enum NotificationType {
  DAS_REMINDER = 'das_reminder',
  SYSTEM = 'system',
  FISCAL = 'fiscal',
  PUSH = 'push',
}

export enum NotificationStatus {
  UNREAD = 'unread',
  READ = 'read',
}

export enum NotificationCategory {
  DAS = 'das',
  SYSTEM = 'system',
  FISCAL = 'fiscal',
}

@Entity('notifications')
@Index(['userId', 'status'])
@Index(['userId', 'category'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 255 })
  title!: string;

  @Column({ type: 'text' })
  body!: string;

  @Column({
    type: 'enum',
    enum: NotificationType,
    enumName: 'notification_type_enum',
  })
  type!: NotificationType;

  @Column({
    type: 'enum',
    enum: NotificationStatus,
    enumName: 'notification_status_enum',
    default: NotificationStatus.UNREAD,
  })
  status!: NotificationStatus;

  @Column({ type: 'jsonb', nullable: true })
  metadata!: Record<string, unknown> | null;

  @Column({
    type: 'enum',
    enum: NotificationCategory,
    enumName: 'notification_category_enum',
  })
  category!: NotificationCategory;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @DeleteDateColumn({ type: 'timestamptz', nullable: true })
  deletedAt!: Date | null;
}
