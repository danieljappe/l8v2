import { AppDataSource } from './config/database';

async function resetDatabase() {
  try {
    console.log('Initializing database connection...');
    await AppDataSource.initialize();
    
    console.log('Dropping all tables...');
    await AppDataSource.dropDatabase();
    
    console.log('Recreating all tables...');
    await AppDataSource.synchronize();
    
    console.log('Database reset complete!');
    await AppDataSource.destroy();
  } catch (error) {
    console.error('Error resetting database:', error);
    process.exit(1);
  }
}

resetDatabase(); 