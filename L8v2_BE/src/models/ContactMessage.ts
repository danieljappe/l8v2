import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

export enum MessageType {
  GENERAL = 'general',
  BOOKING = 'booking',
  SUPPORT = 'support',
  FEEDBACK = 'feedback'
}

export enum MessageStatus {
  PENDING = 'pending',
  READ = 'read',
  REPLIED = 'replied',
  ARCHIVED = 'archived'
}

@Entity()
export class ContactMessage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column({ type: 'text' })
  message!: string;

  @Column({ default: false })
  isRead!: boolean;

  @Column({
    type: 'enum',
    enum: MessageType,
    default: MessageType.GENERAL
  })
  type!: MessageType;

  @Column({
    type: 'enum',
    enum: MessageStatus,
    default: MessageStatus.PENDING
  })
  status!: MessageStatus;

  @Column({ nullable: true })
  phone?: string;

  @Column({ nullable: true })
  subject?: string;

  @Column({ nullable: true })
  eventDate?: Date;

  @Column({ nullable: true })
  artistType?: string;

  @Column({ type: 'text', nullable: true })
  eventDetails?: string;

  @Column({ nullable: true })
  budget?: number;

  @Column({ type: 'text', nullable: true })
  adminNotes?: string;

  @Column({ nullable: true })
  repliedAt?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 