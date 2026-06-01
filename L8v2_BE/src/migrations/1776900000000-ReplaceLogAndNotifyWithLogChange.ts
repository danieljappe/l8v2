import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Removes dead code:
 *   - pg_notify calls (no listener exists in the application)
 *   - notify_billetto_sync() and billetto_sync channel (superseded by log_and_notify_change)
 *
 * Replaces log_and_notify_change() with log_change() — identical audit-insert
 * logic, pg_notify block removed. All nine audit triggers are dropped and
 * recreated pointing at the new function name.
 */
export class ReplaceLogAndNotifyWithLogChange1776900000000 implements MigrationInterface {
  name = 'ReplaceLogAndNotifyWithLogChange1776900000000';

  private readonly tables = [
    'event',
    'artist',
    'user',
    'venue',
    'event_artist',
    'gallery_image',
    'billetto_event_data',
    'event_timeline_item',
    'timeline_slot_artist',
  ];

  public async up(queryRunner: QueryRunner): Promise<void> {
    // ── 1. Drop any remnant of the old Billetto-specific notify function ──────
    await queryRunner.query(`DROP FUNCTION IF EXISTS notify_billetto_sync() CASCADE`);

    // ── 2. Drop all existing audit triggers (they reference log_and_notify_change) ──
    for (const table of this.tables) {
      await queryRunner.query(
        `DROP TRIGGER IF EXISTS "audit_${table}" ON "${table}"`
      );
    }

    // ── 3. Drop the old function ──────────────────────────────────────────────
    await queryRunner.query(`DROP FUNCTION IF EXISTS log_and_notify_change()`);

    // ── 4. Create log_change() — audit INSERT only, no pg_notify ─────────────
    await queryRunner.query(`
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
      $$ LANGUAGE plpgsql;
    `);

    // ── 5. Recreate all audit triggers pointing at log_change() ───────────────
    for (const table of this.tables) {
      await queryRunner.query(`
        CREATE TRIGGER "audit_${table}"
            AFTER INSERT OR UPDATE OR DELETE ON "${table}"
            FOR EACH ROW EXECUTE FUNCTION log_change();
      `);
    }
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop new triggers and function
    for (const table of this.tables) {
      await queryRunner.query(
        `DROP TRIGGER IF EXISTS "audit_${table}" ON "${table}"`
      );
    }
    await queryRunner.query(`DROP FUNCTION IF EXISTS log_change()`);

    // Restore log_and_notify_change() with pg_notify (matches AddUniversalAuditTriggers up())
    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION log_and_notify_change()
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

          PERFORM pg_notify(
              'db_changes',
              json_build_object(
                  'operation', TG_OP,
                  'table',     TG_TABLE_NAME,
                  'entityId',  v_entity_id
              )::text
          );

          RETURN COALESCE(NEW, OLD);
      END;
      $$ LANGUAGE plpgsql;
    `);

    for (const table of this.tables) {
      await queryRunner.query(`
        CREATE TRIGGER "audit_${table}"
            AFTER INSERT OR UPDATE OR DELETE ON "${table}"
            FOR EACH ROW EXECUTE FUNCTION log_and_notify_change();
      `);
    }
  }
}
