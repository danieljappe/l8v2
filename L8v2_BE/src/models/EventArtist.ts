import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
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

  @Column({ nullable: true })
  performanceOrder?: number;

  @Column({ nullable: true })
  performanceTime?: string;

  @Column({ nullable: true })
  setDuration?: number;

  @Column({ nullable: true })
  fee?: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 