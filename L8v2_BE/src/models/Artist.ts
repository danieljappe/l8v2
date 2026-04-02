import { Entity, PrimaryGeneratedColumn, Column, OneToMany, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { EventArtist } from './EventArtist';
import { User } from './User';

export interface SocialMedia {
  platform: string;
  url: string;
}

export interface Embedding {
  id: string;
  platform: 'spotify' | 'youtube' | 'soundcloud';
  embedCode: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  createdAt: Date;
}

@Entity()
export class Artist {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  bio?: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ nullable: true })
  website?: string;

  @Column({ type: 'json', nullable: true })
  socialMedia?: SocialMedia[];

  @Column({ type: 'json', nullable: true })
  embeddings?: Embedding[];

  @Column({ nullable: true })
  genre?: string;

  @Column({ default: false })
  isBookable!: boolean;

  @Column({ nullable: true })
  bookingUserId?: string;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'bookingUserId' })
  bookingUser?: User; 

  @OneToMany(() => EventArtist, eventArtist => eventArtist.artist)
  eventArtists!: EventArtist[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 