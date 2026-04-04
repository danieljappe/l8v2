import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Event } from './Event';

export enum GalleryCategory {
  EVENT = 'event',
  VENUE = 'venue',
  ARTIST = 'artist',
  OTHER = 'other'
}

@Entity()
export class GalleryImage {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  filename!: string;

  @Column()
  url!: string;

  @Column({ nullable: true })
  caption?: string;

  @Column({ nullable: true })
  eventId?: string;

  @ManyToOne(() => Event, event => event.galleryImages, { nullable: true })
  @JoinColumn({ name: 'eventId' })
  event?: Event;

  @Column({ nullable: true })
  photographer?: string;

  @Column({
    type: 'enum',
    enum: GalleryCategory,
    default: GalleryCategory.OTHER
  })
  category!: GalleryCategory;

  @Column({ default: false })
  isPublished!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 