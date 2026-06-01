import { AppDataSource } from '../../config/database';
import { BillettoEventData } from '../../models/BillettoEventData';
import { AuditLog } from '../../models/AuditLog';
import { BillettoService } from '../../services/BillettoService';
import { cleanupDatabase, createTestUser } from '../helpers';

/**
 * Bug A fix: webhook writes must carry NULL attribution regardless of whether
 * a prior authenticated request left app.current_user_id set on the pool
 * connection (is_local=false → session-scoped → persists after request end).
 *
 * handleWebhook now wraps every write in a QueryRunner transaction and resets
 * app.current_user_id to '' with is_local=true (transaction-scoped) before
 * the first write, so the audit trigger always sees NULL on the webhook path.
 */
describe('BillettoService.handleWebhook — NULL attribution (Bug A fix)', () => {
  let service: BillettoService;
  let staleUserId: string;

  beforeAll(async () => {
    service = new BillettoService();

    // Create a real user so the FK on audit_logs.userId is satisfied when the
    // stale connection writes the wrong attribution (the "failing" scenario).
    const { user } = await createTestUser();
    staleUserId = user.id;

    // setup.ts only calls synchronize(true) — triggers/functions are not installed.
    // Install the same log_change function and trigger used in production so the
    // attribution behaviour is testable.
    await AppDataSource.query(`
      CREATE OR REPLACE FUNCTION log_change()
      RETURNS TRIGGER AS $$
      DECLARE
          v_user_id   text;
          v_entity_id text;
          v_old_data  json;
          v_new_data  json;
      BEGIN
          v_user_id := current_setting('app.current_user_id', true);
          IF v_user_id = '' THEN v_user_id := NULL; END IF;

          IF TG_OP = 'DELETE' THEN
              v_entity_id := OLD.id::text;
              v_old_data  := row_to_json(OLD);
              v_new_data  := NULL;
          ELSIF TG_OP = 'INSERT' THEN
              v_entity_id := NEW.id::text;
              v_old_data  := NULL;
              v_new_data  := row_to_json(NEW);
          ELSE
              v_entity_id := NEW.id::text;
              v_old_data  := row_to_json(OLD);
              v_new_data  := row_to_json(NEW);
          END IF;

          INSERT INTO audit_logs
              ("userId", action, "entityType", "entityId", "oldValues", "newValues", "createdAt")
          VALUES (
              NULLIF(v_user_id, '')::uuid,
              TG_OP,
              TG_TABLE_NAME,
              v_entity_id,
              v_old_data,
              v_new_data,
              now()
          );

          RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql
    `);

    await AppDataSource.query(
      `DROP TRIGGER IF EXISTS "audit_billetto_event_data" ON "billetto_event_data"`
    );
    await AppDataSource.query(`
      CREATE TRIGGER "audit_billetto_event_data"
      AFTER INSERT OR UPDATE OR DELETE ON "billetto_event_data"
      FOR EACH ROW EXECUTE FUNCTION log_change()
    `);
  });

  afterAll(async () => {
    await AppDataSource.query(
      `DROP TRIGGER IF EXISTS "audit_billetto_event_data" ON "billetto_event_data"`
    );
    await AppDataSource.query(`DROP FUNCTION IF EXISTS log_change() CASCADE`);
    await cleanupDatabase();
  });

  afterEach(async () => {
    // Reset stale value so the cleanup DELETEs don't themselves trigger the
    // audit function with a dangling UUID → FK violation.
    await AppDataSource.query(`SELECT set_config('app.current_user_id', '', false)`);
    await AppDataSource.query(`DELETE FROM "billetto_event_data"`);
    await AppDataSource.query(`DELETE FROM "audit_logs"`);
  });

  it('attributes event.cancelled write to NULL even when pool connection carries stale app.current_user_id', async () => {
    // 1. Seed a BillettoEventData record via the regular pool.
    const repo = AppDataSource.getRepository(BillettoEventData);
    const record = repo.create({
      billettoEventId: 'billetto-test-999',
      publicUrl: 'https://billetto.dk/e/test-999',
      ticketsAvailable: 100,
      lastSyncedAt: new Date(),
    });
    await repo.save(record);

    // Clear the INSERT audit log from the seed above.
    await AppDataSource.query(`DELETE FROM "audit_logs"`);

    // 2. Pollute the idle pool connection with a real user's ID (is_local=false →
    //    session-scoped, survives after this query returns the connection to the
    //    pool).  pg's pool is LIFO: the connection just released is the next one
    //    acquired, so in the single-threaded --runInBand process the stale value
    //    is reliably present on the connection the next pool operation receives.
    await AppDataSource.query(
      `SELECT set_config('app.current_user_id', $1, false)`,
      [staleUserId],
    );

    // 3. Fire the webhook handler directly (bypasses the route's fire-and-forget
    //    so we can await the result synchronously).
    await service.handleWebhook({
      type: 'event.cancelled',
      data: { id: 'billetto-test-999' },
    });

    // 4. The UPDATE audit entry must have userId = NULL, not the stale UUID.
    const logs = await AppDataSource.getRepository(AuditLog).find({
      where: { entityType: 'billetto_event_data', action: 'UPDATE' },
    });

    expect(logs).toHaveLength(1);
    expect(logs[0].userId).toBeNull();
  });
});
