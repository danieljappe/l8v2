import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany, OneToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Venue } from './Venue';
import { EventArtist } from './EventArtist';
import { GalleryImage } from './GalleryImage';
import { BillettoEventData } from './BillettoEventData';

@Entity()
export class Event {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  title!: string;

  @Column({ type: 'text' })
  description!: string;

  @Column()
  date!: Date;

  @Column()
  startTime!: string;

  @Column({ nullable: true })
  endTime?: string;

  @Column({ default: 0 })
  soldTickets!: number;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ default: 'draft' })
  status!: string;

  @Column({ nullable: true })
  billettoURL?: string;

  @Column({ nullable: true })
  venueId?: string;

  @ManyToOne(() => Venue, venue => venue.events, { nullable: true })
  @JoinColumn({ name: 'venueId' })
  venue?: Venue;

  @OneToMany(() => EventArtist, eventArtist => eventArtist.event)
  eventArtists!: EventArtist[];

  @OneToMany(() => GalleryImage, galleryImage => galleryImage.event)
  galleryImages!: GalleryImage[];

  @OneToOne(() => BillettoEventData, billettoData => billettoData.event)
  billettoData?: BillettoEventData;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 