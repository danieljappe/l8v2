import { Express } from 'express';
import request from 'supertest';
import bcrypt from 'bcryptjs';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { createApp } from '../App';

export function createTestApp(): Express {
  return createApp();
}

export async function createTestUser(overrides: {
  email?: string;
  password?: string;
  firstName?: string;
  lastName?: string;
} = {}): Promise<{ user: User; plainPassword: string }> {
  const plainPassword = overrides.password ?? 'TestPassword123!';
  const userRepo = AppDataSource.getRepository(User);
  const user = userRepo.create({
    firstName: overrides.firstName ?? 'Test',
    lastName: overrides.lastName ?? 'User',
    email: overrides.email ?? `test-${Date.now()}@example.com`,
    password: await bcrypt.hash(plainPassword, 10),
  });
  return { user: await userRepo.save(user), plainPassword };
}

export async function getAuthToken(
  app: Express,
  email: string,
  plainPassword: string,
): Promise<string> {
  const res = await request(app)
    .post('/api/auth/login')
    .send({ email, password: plainPassword });
  return res.body.token as string;
}

export async function cleanupDatabase(): Promise<void> {
  const entities = AppDataSource.entityMetadatas;
  for (const entity of entities) {
    await AppDataSource.query(`TRUNCATE TABLE "${entity.tableName}" CASCADE`);
  }
}
