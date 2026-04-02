import { DataSource } from 'typeorm';
import { User } from './src/models/User';
import { Artist } from './src/models/Artist';
import { Event } from './src/models/Event';
import { Venue } from './src/models/Venue';
import { Ticket } from './src/models/Ticket';
import { GalleryImage } from './src/models/GalleryImage';
import { ContactMessage } from './src/models/ContactMessage';
import { EventArtist } from './src/models/EventArtist';
import * as dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_USER = 'postgres',
  DB_PASSWORD = 'postgres',
  DB_NAME = 'l8v2',
  NODE_ENV = 'development'
} = process.env;

export default new DataSource({
  type: 'postgres',
  host: DB_HOST,
  port: parseInt(DB_PORT),
  username: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME,
  synchronize: NODE_ENV === 'development', // Enable synchronize in development
  logging: true,
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
  migrations: ['src/migrations/*.ts'],
  subscribers: ['src/subscribers/*.ts']
});
