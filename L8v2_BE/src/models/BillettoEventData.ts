import { Entity, PrimaryGeneratedColumn, Column, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Event } from './Event';

@Entity({ name: 'billetto_event_data' })
export class BillettoEventData {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true, nullable: true })
  eventId!: string | null;

  @OneToOne(() => Event, event => event.billettoData, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'eventId' })
  event!: Event | null;

  @Column({ unique: true })
  billettoEventId!: string;

  @Column({ nullable: true })
  eventName?: string;

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

  // Populated by EventService from the event_ticket_availability view — not a DB column.
  availabilityLabel?: string | null;
}
