import { Entity, PrimaryGeneratedColumn, ManyToOne, Column, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Event } from './Event';
import { User } from './User';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @ManyToOne(() => Event)
  @JoinColumn()
  event!: Event;

  @ManyToOne(() => User)
  @JoinColumn()
  user!: User;

  @Column()
  ticketNumber!: string;

  @Column()
  price!: number;

  @Column({ default: false })
  isUsed!: boolean;

  @Column({ nullable: true })
  usedAt?: Date;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  quantity?: number;

  @Column({ default: 0 })
  sold!: number;

  @Column({ nullable: true })
  saleStartDate?: Date;

  @Column({ nullable: true })
  saleEndDate?: Date;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 