import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Replaces the narrow billetto-only pg_notify trigger with a universal
 * log_and_notify_change() function applied to all central tables.
 * Every INSERT/UPDATE/DELETE writes to audit_logs and fires pg_notify('db_changes').
 * userId is populated from the app.current_user_id session variable set by authMiddleware.
 */
export class AddUniversalAuditTriggers1776470400000 implements MigrationInterface {
    name = 'AddUniversalAuditTriggers1776470400000';

    private readonly tables = [
        'event',
        'artist',
        'user',
        'venue',
        'event_artist',
        'gallery_image',
        'billetto_event_data',
    ];

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop the old Billetto-specific trigger and function
        await queryRunner.query(`DROP TRIGGER IF EXISTS billetto_event_data_audit ON "billetto_event_data"`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS notify_billetto_sync()`);

        // Create the universal trigger function
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
                VALUES
                    (
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

        // Apply to all central tables
        for (const table of this.tables) {
            await queryRunner.query(`
                CREATE TRIGGER audit_${table}
                    AFTER INSERT OR UPDATE OR DELETE ON "${table}"
                    FOR EACH ROW EXECUTE FUNCTION log_and_notify_change();
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const table of this.tables) {
            await queryRunner.query(`DROP TRIGGER IF EXISTS audit_${table} ON "${table}"`);
        }
        await queryRunner.query(`DROP FUNCTION IF EXISTS log_and_notify_change()`);

        // Restore the original Billetto-specific trigger
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION notify_billetto_sync()
            RETURNS TRIGGER AS $$
            BEGIN
                PERFORM pg_notify(
                    'billetto_sync',
                    json_build_object(
                        'operation',        TG_OP,
                        'billettoEventId',  NEW."billettoEventId",
                        'eventId',          NEW."eventId",
                        'ticketsAvailable', NEW."ticketsAvailable",
                        'maxCapacity',      NEW."maxCapacity",
                        'lastSyncedAt',     NEW."lastSyncedAt"
                    )::text
                );
                RETURN NEW;
            END;
            $$ LANGUAGE plpgsql;
        `);
        await queryRunner.query(`
            CREATE TRIGGER billetto_event_data_audit
                AFTER INSERT OR UPDATE ON "billetto_event_data"
                FOR EACH ROW EXECUTE FUNCTION notify_billetto_sync();
        `);
    }
}
