import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEventTimelineTable1776556800000 implements MigrationInterface {
    name = 'AddEventTimelineTable1776556800000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create the event_timeline_item table
        await queryRunner.query(`
            CREATE TABLE "event_timeline_item" (
                "id"               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                "event_id"         UUID        NOT NULL REFERENCES "event"("id") ON DELETE CASCADE,
                "position"         INTEGER     NOT NULL,
                "start_time"       VARCHAR(5),
                "duration_minutes" INTEGER,
                "type"             VARCHAR(20) NOT NULL,
                "event_artist_id"  UUID        REFERENCES "event_artist"("id") ON DELETE CASCADE,
                "title"            VARCHAR(255) NOT NULL,
                "notes"            TEXT,
                "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
                "updated_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
                UNIQUE ("event_id", "position") DEFERRABLE INITIALLY DEFERRED,
                CHECK (
                    ("type" = 'artist_set' AND "event_artist_id" IS NOT NULL) OR
                    ("type" != 'artist_set' AND "event_artist_id" IS NULL)
                )
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_timeline_event_id" ON "event_timeline_item" ("event_id")
        `);

        // Trigger function to renumber positions after a delete
        await queryRunner.query(`
            CREATE OR REPLACE FUNCTION renumber_timeline_positions()
            RETURNS TRIGGER AS $$
            BEGIN
                UPDATE "event_timeline_item"
                SET "position" = subq.new_pos
                FROM (
                    SELECT id, ROW_NUMBER() OVER (ORDER BY "position") AS new_pos
                    FROM "event_timeline_item"
                    WHERE "event_id" = OLD."event_id"
                ) subq
                WHERE "event_timeline_item"."id" = subq.id;
                RETURN NULL;
            END;
            $$ LANGUAGE plpgsql;
        `);

        await queryRunner.query(`
            CREATE TRIGGER reorder_after_delete
            AFTER DELETE ON "event_timeline_item"
            FOR EACH ROW EXECUTE FUNCTION renumber_timeline_positions()
        `);

        // Apply the universal audit trigger
        await queryRunner.query(`
            CREATE TRIGGER audit_event_timeline_item
            AFTER INSERT OR UPDATE OR DELETE ON "event_timeline_item"
            FOR EACH ROW EXECUTE FUNCTION log_and_notify_change()
        `);

        // Backfill from existing event_artist rows
        // performanceOrder/performanceTime/setDuration use camelCase column names (TypeORM default)
        await queryRunner.query(`
            INSERT INTO "event_timeline_item" (
                "id", "event_id", "position", "start_time", "duration_minutes",
                "type", "event_artist_id", "title", "created_at", "updated_at"
            )
            SELECT
                gen_random_uuid(),
                ea."eventId",
                ROW_NUMBER() OVER (
                    PARTITION BY ea."eventId"
                    ORDER BY ea."performanceOrder" NULLS LAST, ea."createdAt"
                )::integer,
                ea."performanceTime",
                ea."setDuration",
                'artist_set',
                ea.id,
                a.name,
                now(),
                now()
            FROM "event_artist" ea
            JOIN "artist" a ON a.id = ea."artistId"
        `);

        // Denormalized view for efficient reads
        await queryRunner.query(`
            CREATE OR REPLACE VIEW "event_running_order" AS
            SELECT
                ti."id",
                ti."event_id",
                ti."position",
                ti."start_time",
                ti."duration_minutes",
                ti."type",
                ti."title",
                ti."notes",
                ti."event_artist_id",
                a."id"        AS "artist_id",
                a."name"      AS "artist_name",
                a."genre"     AS "artist_genre",
                a."imageUrl"  AS "artist_image_url"
            FROM "event_timeline_item" ti
            LEFT JOIN "event_artist" ea ON ea."id" = ti."event_artist_id"
            LEFT JOIN "artist" a ON a."id" = ea."artistId"
            ORDER BY ti."event_id", ti."position"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP VIEW IF EXISTS "event_running_order"`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS audit_event_timeline_item ON "event_timeline_item"`);
        await queryRunner.query(`DROP TRIGGER IF EXISTS reorder_after_delete ON "event_timeline_item"`);
        await queryRunner.query(`DROP FUNCTION IF EXISTS renumber_timeline_positions()`);
        await queryRunner.query(`DROP TABLE IF EXISTS "event_timeline_item"`);
    }
}
