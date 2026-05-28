import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTimelineSlotArtistTable1776729600000 implements MigrationInterface {
    name = 'AddTimelineSlotArtistTable1776729600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Join table: one row per (slot, artist) pair
        await queryRunner.query(`
            CREATE TABLE "timeline_slot_artist" (
                "id"               UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
                "timeline_item_id" UUID        NOT NULL REFERENCES "event_timeline_item"("id") ON DELETE CASCADE,
                "event_artist_id"  UUID        NOT NULL REFERENCES "event_artist"("id") ON DELETE CASCADE,
                "created_at"       TIMESTAMPTZ NOT NULL DEFAULT now(),
                UNIQUE ("timeline_item_id", "event_artist_id")
            )
        `);

        await queryRunner.query(`
            CREATE INDEX "idx_tsa_timeline_item_id" ON "timeline_slot_artist" ("timeline_item_id")
        `);

        // Audit
        await queryRunner.query(`
            CREATE TRIGGER audit_timeline_slot_artist
            AFTER INSERT OR UPDATE OR DELETE ON "timeline_slot_artist"
            FOR EACH ROW EXECUTE FUNCTION log_and_notify_change()
        `);

        // Backfill: artist_set slots — one row each from the existing FK
        await queryRunner.query(`
            INSERT INTO "timeline_slot_artist" ("timeline_item_id", "event_artist_id", "created_at")
            SELECT "id", "event_artist_id", now()
            FROM "event_timeline_item"
            WHERE "type" = 'artist_set'
              AND "event_artist_id" IS NOT NULL
            ON CONFLICT ("timeline_item_id", "event_artist_id") DO NOTHING
        `);

        // Backfill: collab slots — expand the JSON collaborators array
        await queryRunner.query(`
            INSERT INTO "timeline_slot_artist" ("timeline_item_id", "event_artist_id", "created_at")
            SELECT
                ti."id",
                (collab_row->>'id')::uuid,
                now()
            FROM "event_timeline_item" ti,
                json_array_elements((ti."notes"::json)->'collaborators') AS collab_row
            WHERE ti."type" = 'custom'
              AND ti."notes" IS NOT NULL
              AND (ti."notes"::json->>'_collab') = 'true'
            ON CONFLICT ("timeline_item_id", "event_artist_id") DO NOTHING
        `);

        // Promote collab slots from custom → collab_set now that the data lives in the join table
        await queryRunner.query(`
            UPDATE "event_timeline_item"
            SET "type" = 'collab_set'
            WHERE "type" = 'custom'
              AND "notes" IS NOT NULL
              AND (("notes"::json)->>'_collab') = 'true'
        `);

        // Rebuild view with collaborators JSON array
        await queryRunner.query(`DROP VIEW IF EXISTS "event_running_order"`);
        await queryRunner.query(`
            CREATE VIEW "event_running_order" AS
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
                a."id"       AS "artist_id",
                a."name"     AS "artist_name",
                a."genre"    AS "artist_genre",
                a."imageUrl" AS "artist_image_url",
                COALESCE(
                    (SELECT json_agg(
                        json_build_object(
                            'id',       tsa."event_artist_id",
                            'artistId', ea2."artistId",
                            'name',     a2."name"
                        ) ORDER BY tsa."created_at"
                     )
                     FROM "timeline_slot_artist" tsa
                     JOIN "event_artist" ea2 ON ea2."id" = tsa."event_artist_id"
                     JOIN "artist" a2 ON a2."id" = ea2."artistId"
                     WHERE tsa."timeline_item_id" = ti."id"),
                    '[]'::json
                ) AS "collaborators"
            FROM "event_timeline_item" ti
            LEFT JOIN "event_artist" ea ON ea."id" = ti."event_artist_id"
            LEFT JOIN "artist" a ON a."id" = ea."artistId"
            ORDER BY ti."event_id", ti."position"
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert collab_set → custom
        await queryRunner.query(`
            UPDATE "event_timeline_item"
            SET "type" = 'custom'
            WHERE "type" = 'collab_set'
        `);

        // Restore previous view (no collaborators column)
        await queryRunner.query(`DROP VIEW IF EXISTS "event_running_order"`);
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

        await queryRunner.query(`DROP TABLE IF EXISTS "timeline_slot_artist"`);
    }
}
