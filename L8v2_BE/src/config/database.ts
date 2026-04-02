import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Artist } from '../models/Artist';
import { Event } from '../models/Event';
import { Venue } from '../models/Venue';
import { Ticket } from '../models/Ticket';
import { GalleryImage } from '../models/GalleryImage';
import { ContactMessage } from '../models/ContactMessage';
import { EventArtist } from '../models/EventArtist';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_USER = 'postgres',
  DB_PASSWORD = 'postgres',
  DB_NAME = 'l8v2',
  NODE_ENV = 'development'
} = process.env;

// Debug logging
console.log('Database Configuration:');
console.log('Host:', DB_HOST);
console.log('Port:', DB_PORT);
console.log('User:', DB_USER);
console.log('Database:', DB_NAME);
console.log('Environment:', NODE_ENV);
console.log('Password length:', DB_PASSWORD ? DB_PASSWORD.length : 0);

const isProduction = NODE_ENV === 'production';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: parseInt(DB_PORT),
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: false, // Always false - use migrations
  logging: !isProduction,
  extra: {
    ssl: false,
    trustServerCertificate: true,
    encrypt: false,
    authenticationMethod: 'scram-sha-256'
  },
  entities: [
    User,
    Artist,
    Event,
    Venue,
    Ticket,
    GalleryImage,
    ContactMessage,
    EventArtist
  ],
  migrations: [
    isProduction 
      ? path.join(__dirname, '../migrations/*.js')
      : path.join(__dirname, '../migrations/*.ts')
  ],
  migrationsTableName: 'migrations'
});