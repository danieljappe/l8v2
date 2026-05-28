import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn,
  CreateDateColumn, UpdateDateColumn, Index
} from 'typeorm';
import { Event } from './Event';
import { EventArtist } from './EventArtist';

export type TimelineItemType = 'artist_set' | 'break' | 'dj_set' | 'talk' | 'custom';

@Entity('event_timeline_item')
@Index('idx_timeline_event_id', ['eventId'])
export class EventTimelineItem {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_id' })
  event!: Event;

  @Column({ name: 'event_id' })
  eventId!: string;

  @Column()
  position!: number;

  @Column({ name: 'start_time', nullable: true })
  startTime?: string;

  @Column({ name: 'duration_minutes', nullable: true })
  durationMinutes?: number;

  @Column({ length: 20 })
  type!: TimelineItemType;

  @ManyToOne(() => EventArtist, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_artist_id' })
  eventArtist?: EventArtist;

  @Column({ name: 'event_artist_id', nullable: true })
  eventArtistId?: string;

  @Column({ length: 255 })
  title!: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt!: Date;
}
