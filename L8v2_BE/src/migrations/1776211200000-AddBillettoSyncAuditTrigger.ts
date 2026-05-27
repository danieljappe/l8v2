import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Adds a PostgreSQL trigger on billetto_event_data that fires pg_notify('billetto_sync', ...)
 * on every INSERT or UPDATE. This provides the observability foundation described in the
 * integration architecture: sync event flows become traceable at the database layer,
 * independent of application-layer logging.
 */
export class AddBillettoSyncAuditTrigger1776211200000 implements MigrationInterface {
    name = 'AddBillettoSyncAuditTrigger1776211200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
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

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TRIGGER IF EXISTS billetto_event_data_audit ON "billetto_event_data"`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS notify_billetto_sync()`);
    }
}
