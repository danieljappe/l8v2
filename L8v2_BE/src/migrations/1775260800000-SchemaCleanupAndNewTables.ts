import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Schema cleanup and new tables migration:
 *
 * Removals:
 *  - artist:          website, rating, isActive
 *  - contact_message: type (+ enum type), eventDate, eventDetails, budget, adminNotes, repliedAt
 *  - event:           ticketPrice, totalTickets, oldTickets, capacity, currentAttendees
 *  - event_artist:    fee
 *  - gallery_image:   thumbnailUrl, mediumUrl, largeUrl, tags, orderIndex
 *  - ticket:          entire table (deprecated)
 *  - user:            isActive, address
 *  - venue:           imageUrl, images, country, isActive, latitude, longitude
 *
 * Additions:
 *  - audit_logs:           user activity tracking
 *  - billetto_event_data:  external Billetto event sync data
 */
export class SchemaCleanupAndNewTables1775260800000 implements MigrationInterface {
    name = 'SchemaCleanupAndNewTables1775260800000';

    public async up(queryRunner: QueryRunner): Promise<void> {

        // ── 1. artist ──────────────────────────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN IF EXISTS "website"`);
        await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN IF EXISTS "rating"`);
        await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN IF EXISTS "isActive"`);


        // ── 2. contact_message ────────────────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN IF EXISTS "type"`);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN IF EXISTS "eventDate"`);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN IF EXISTS "eventDetails"`);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN IF EXISTS "budget"`);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN IF EXISTS "adminNotes"`);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN IF EXISTS "repliedAt"`);
        await queryRunner.query(`DROP TYPE IF EXISTS "contact_message_type_enum"`);


        // ── 3. event ──────────────────────────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN IF EXISTS "ticketPrice"`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN IF EXISTS "totalTickets"`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN IF EXISTS "oldTickets"`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN IF EXISTS "capacity"`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN IF EXISTS "currentAttendees"`);


        // ── 4. event_artist ───────────────────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "event_artist" DROP COLUMN IF EXISTS "fee"`);


        // ── 5. gallery_image ──────────────────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "gallery_image" DROP COLUMN IF EXISTS "thumbnailUrl"`);
        await queryRunner.query(`ALTER TABLE "gallery_image" DROP COLUMN IF EXISTS "mediumUrl"`);
        await queryRunner.query(`ALTER TABLE "gallery_image" DROP COLUMN IF EXISTS "largeUrl"`);
        await queryRunner.query(`ALTER TABLE "gallery_image" DROP COLUMN IF EXISTS "tags"`);
        await queryRunner.query(`ALTER TABLE "gallery_image" DROP COLUMN IF EXISTS "orderIndex"`);


        // ── 6. ticket (deprecated) ────────────────────────────────────────────
        await queryRunner.query(`DROP TABLE IF EXISTS "ticket" CASCADE`);


        // ── 7. user ───────────────────────────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "isActive"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "address"`);


        // ── 8. venue ──────────────────────────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN IF EXISTS "imageUrl"`);
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN IF EXISTS "images"`);
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN IF EXISTS "country"`);
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN IF EXISTS "isActive"`);
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN IF EXISTS "latitude"`);
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN IF EXISTS "longitude"`);


        // ── 9. Create audit_logs ──────────────────────────────────────────────
        await queryRunner.query(`
            CREATE TABLE "audit_logs" (
                "id"          SERIAL PRIMARY KEY,
                "userId"      uuid REFERENCES "user"("id") ON DELETE SET NULL,
                "action"      character varying NOT NULL,
                "entityType"  character varying,
                "entityId"    character varying,
                "metadata"    json,
                "ipAddress"   character varying,
                "createdAt"   TIMESTAMP NOT NULL DEFAULT now()
            )
        `);


        // ── 10. Create billetto_event_data ────────────────────────────────────
        await queryRunner.query(`
            CREATE TABLE "billetto_event_data" (
                "id"               SERIAL PRIMARY KEY,
                "eventId"          uuid NOT NULL UNIQUE REFERENCES "event"("id") ON DELETE CASCADE,
                "billettoEventId"  character varying NOT NULL UNIQUE,
                "publicUrl"        character varying NOT NULL,
                "maxCapacity"      integer,
                "ticketsAvailable" integer,
                "lastSyncedAt"     TIMESTAMP NOT NULL,
                "createdAt"        TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt"        TIMESTAMP NOT NULL DEFAULT now()
            )
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // ── 10. Drop billetto_event_data ──────────────────────────────────────
        await queryRunner.query(`DROP TABLE IF EXISTS "billetto_event_data"`);


        // ── 9. Drop audit_logs ────────────────────────────────────────────────
        await queryRunner.query(`DROP TABLE IF EXISTS "audit_logs"`);


        // ── 8. Restore venue columns ──────────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "venue" ADD COLUMN IF NOT EXISTS "longitude" numeric`);
        await queryRunner.query(`ALTER TABLE "venue" ADD COLUMN IF NOT EXISTS "latitude" numeric`);
        await queryRunner.query(`ALTER TABLE "venue" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "venue" ADD COLUMN IF NOT EXISTS "country" character varying`);
        await queryRunner.query(`ALTER TABLE "venue" ADD COLUMN IF NOT EXISTS "images" text`);
        await queryRunner.query(`ALTER TABLE "venue" ADD COLUMN IF NOT EXISTS "imageUrl" character varying`);


        // ── 7. Restore user columns ───────────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "address" character varying`);
        await queryRunner.query(`ALTER TABLE "user" ADD COLUMN IF NOT EXISTS "isActive" boolean NOT NULL DEFAULT true`);


        // ── 6. Recreate ticket table ──────────────────────────────────────────
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "ticket" (
                "id"            uuid NOT NULL DEFAULT uuid_generate_v4(),
                "eventId"       uuid NOT NULL,
                "userId"        uuid NOT NULL,
                "ticketNumber"  character varying NOT NULL,
                "price"         numeric NOT NULL,
                "isUsed"        boolean NOT NULL DEFAULT false,
                "usedAt"        TIMESTAMP,
                "isActive"      boolean NOT NULL DEFAULT true,
                "quantity"      integer,
                "sold"          integer NOT NULL DEFAULT 0,
                "saleStartDate" TIMESTAMP,
                "saleEndDate"   TIMESTAMP,
                "createdAt"     TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt"     TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_ticket" PRIMARY KEY ("id"),
                CONSTRAINT "FK_ticket_event" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION,
                CONSTRAINT "FK_ticket_user"  FOREIGN KEY ("userId")  REFERENCES "user"("id")  ON DELETE NO ACTION
            )
        `);


        // ── 5. Restore gallery_image columns ──────────────────────────────────
        await queryRunner.query(`ALTER TABLE "gallery_image" ADD COLUMN IF NOT EXISTS "orderIndex" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "gallery_image" ADD COLUMN IF NOT EXISTS "tags" text`);
        await queryRunner.query(`ALTER TABLE "gallery_image" ADD COLUMN IF NOT EXISTS "largeUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "gallery_image" ADD COLUMN IF NOT EXISTS "mediumUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "gallery_image" ADD COLUMN IF NOT EXISTS "thumbnailUrl" character varying`);


        // ── 4. Restore event_artist.fee ───────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "event_artist" ADD COLUMN IF NOT EXISTS "fee" numeric`);


        // ── 3. Restore event columns ──────────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "currentAttendees" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "capacity" integer`);
        await queryRunner.query(`ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "totalTickets" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "ticketPrice" numeric(10,2) NOT NULL DEFAULT 0`);


        // ── 2. Restore contact_message columns ────────────────────────────────
        await queryRunner.query(`ALTER TABLE "contact_message" ADD COLUMN IF NOT EXISTS "repliedAt" date`);
        await queryRunner.query(`ALTER TABLE "contact_message" ADD COLUMN IF NOT EXISTS "adminNotes" text`);
        await queryRunner.query(`ALTER TABLE "contact_message" ADD COLUMN IF NOT EXISTS "budget" numeric`);
        await queryRunner.query(`ALTER TABLE "contact_message" ADD COLUMN IF NOT EXISTS "eventDetails" text`);
        await queryRunner.query(`ALTER TABLE "contact_message" ADD COLUMN IF NOT EXISTS "eventDate" date`);
        await queryRunner.query(`
            DO $$ BEGIN
                IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'contact_message_type_enum') THEN
                    CREATE TYPE "contact_message_type_enum" AS ENUM ('general', 'booking', 'support', 'feedback');
                END IF;
            END $$
        `);
        await queryRunner.query(`
            ALTER TABLE "contact_message"
            ADD COLUMN IF NOT EXISTS "type" "contact_message_type_enum" NOT NULL DEFAULT 'general'
        `);


        // ── 1. Restore artist columns ─────────────────────────────────────────
        await queryRunner.query(`ALTER TABLE "artist" ADD COLUMN IF NOT EXISTS "website" character varying`);
    }
}
