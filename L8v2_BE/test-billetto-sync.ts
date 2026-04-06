import 'reflect-metadata';
import * as dotenv from 'dotenv';
dotenv.config();

import { AppDataSource } from './src/config/database';
import { BillettoService } from './src/services/BillettoService';

async function main() {
  await AppDataSource.initialize();
  console.log('DB connected');

  const service = new BillettoService();
  const result = await service.syncAllEvents();
  console.log('\nSync result:', JSON.stringify(result, null, 2));

  const records = await service.getAllRecords();
  console.log(`\nRecords in DB (${records.length}):`);
  for (const r of records) {
    console.log(`  [${r.billettoEventId}] capacity=${r.maxCapacity} available=${r.ticketsAvailable} linked=${!!r.eventId}`);
  }

  await AppDataSource.destroy();
}

main().catch(err => { console.error(err); process.exit(1); });
