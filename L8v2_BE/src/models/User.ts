import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column()
  firstName!: string;

  @Column()
  lastName!: string;

  @Column({ unique: true })
  email!: string;

  // select: false keeps the hash out of every find()/relation load, so it can
  // never reach a response by accident — including via Artist.bookingUser and
  // AuditLog.user. Read it explicitly with UserRepository's *WithPassword
  // methods. This is a query-level concern only; the column is unchanged, so
  // no migration is required.
  @Column({ select: false })
  password!: string;

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ nullable: true })
  imageUrl?: string;

  @Column({ nullable: true })
  role?: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 