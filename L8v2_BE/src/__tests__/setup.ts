import dotenv from 'dotenv';
import path from 'path';

// Load test env vars synchronously before any test module imports database.ts.
// dotenv.config() in database.ts does NOT override already-set vars, so these
// values win even though database.ts calls dotenv.config() later.
dotenv.config({ path: path.resolve(__dirname, '../../.env.test'), override: true });

beforeAll(async () => {
  // Dynamic import ensures database.ts is first required AFTER the env vars
  // above are set, so AppDataSource is constructed with DB_NAME=l8v2_test.
  const { AppDataSource } = await import('../config/database');
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  // Drop all tables and recreate schema from entities for a clean slate.
  await AppDataSource.synchronize(true);
});

afterAll(async () => {
  const { AppDataSource } = await import('../config/database');
  if (AppDataSource.isInitialized) {
    await AppDataSource.dropDatabase();
    await AppDataSource.destroy();
  }
});
