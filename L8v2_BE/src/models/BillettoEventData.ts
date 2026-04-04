import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Event } from './Event';

@Entity({ name: 'billetto_event_data' })
export class BillettoEventData {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  eventId!: string;

  @OneToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'eventId' })
  event!: Event;

  @Column({ unique: true })
  billettoEventId!: string;

  @Column()
  publicUrl!: string;

  @Column({ nullable: true })
  maxCapacity?: number;

  @Column({ nullable: true })
  ticketsAvailable?: number;

  @Column()
  lastSyncedAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
