import {
  Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, Index
} from 'typeorm';
import { EventTimelineItem } from './EventTimelineItem';
import { EventArtist } from './EventArtist';

@Entity('timeline_slot_artist')
@Index('idx_tsa_timeline_item_id', ['timelineItemId'])
export class TimelineSlotArtist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => EventTimelineItem, item => item.slotArtists, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'timeline_item_id' })
  timelineItem!: EventTimelineItem;

  @Column({ name: 'timeline_item_id' })
  timelineItemId!: string;

  @ManyToOne(() => EventArtist, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'event_artist_id' })
  eventArtist!: EventArtist;

  @Column({ name: 'event_artist_id' })
  eventArtistId!: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
