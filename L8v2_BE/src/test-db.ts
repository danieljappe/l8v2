import { Client } from 'pg';
import * as dotenv from 'dotenv';

dotenv.config();

const {
  DB_HOST = 'localhost',
  DB_PORT = '5432',
  DB_USER = 'postgres',
  DB_PASSWORD = 'postgres',
  DB_NAME = 'l8v2'
} = process.env;

console.log('Testing database connection with these settings:');
console.log('Host:', DB_HOST);
console.log('Port:', DB_PORT);
console.log('User:', DB_USER);
console.log('Database:', DB_NAME);
console.log('Password length:', DB_PASSWORD ? DB_PASSWORD.length : 0);

const client = new Client({
  host: DB_HOST,
  port: parseInt(DB_PORT),
  user: DB_USER,
  password: DB_PASSWORD,
  database: DB_NAME
});

async function testConnection() {
  try {
    await client.connect();
    console.log('Successfully connected to the database!');
    
    // Test a simple query
    const result = await client.query('SELECT version()');
    console.log('PostgreSQL version:', result.rows[0].version);
    
    await client.end();
  } catch (err) {
    console.error('Error connecting to the database:', err);
  }
}

testConnection(); 