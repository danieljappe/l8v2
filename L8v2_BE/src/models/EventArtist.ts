import { Entity, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Event } from './Event';
import { Artist } from './Artist';

@Entity()
export class EventArtist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Event, event => event.eventArtists)
  @JoinColumn()
  event!: Event;

  @ManyToOne(() => Artist, artist => artist.eventArtists)
  @JoinColumn()
  artist!: Artist;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 