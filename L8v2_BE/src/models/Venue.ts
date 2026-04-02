import { Entity, PrimaryGeneratedColumn, Column, OneToMany, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Event } from './Event';

@Entity()
export class Venue {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column()
  address!: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column('simple-array', { nullable: true })
  images?: string[];

  @Column({ type: 'text', nullable: true })
  mapEmbedHtml?: string;

  @OneToMany(() => Event, event => event.venue)
  events!: Event[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 