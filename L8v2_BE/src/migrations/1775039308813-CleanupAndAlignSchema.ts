import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Cleanup and schema alignment migration:
 *
 * 1. Make venue.description nullable (entity declares nullable: true)
 * 2. Drop 9 empty legacy tables left over from the original schema generation
 * 3. Drop duplicate FK constraints on event, event_artist, gallery_image, ticket
 */
export class CleanupAndAlignSchema1775039308813 implements MigrationInterface {
    name = 'CleanupAndAlignSchema1775039308813'

    public async up(queryRunner: QueryRunner): Promise<void> {

        // ── 1. venue.description: DROP NOT NULL ──────────────────────────────
        // Entity has nullable: true but the column was created with NOT NULL.
        await queryRunner.query(`ALTER TABLE "venue" ALTER COLUMN "description" DROP NOT NULL`);


        // ── 2. Drop empty legacy tables ──────────────────────────────────────
        // These are leftovers from the first schema generation. All are empty.
        // Drop in dependency order (child tables before parent tables).

        // event_artists references legacy artists + events
        await queryRunner.query(`DROP TABLE IF EXISTS "event_artists" CASCADE`);

        // gallery_images references legacy events
        await queryRunner.query(`DROP TABLE IF EXISTS "gallery_images" CASCADE`);

        // tickets references legacy events + users
        await queryRunner.query(`DROP TABLE IF EXISTS "tickets" CASCADE`);

        // contact_messages (no outgoing FKs)
        await queryRunner.query(`DROP TABLE IF EXISTS "contact_messages" CASCADE`);

        // events references legacy venues
        await queryRunner.query(`DROP TABLE IF EXISTS "events" CASCADE`);

        // artists (referenced by event_artists — already dropped above)
        await queryRunner.query(`DROP TABLE IF EXISTS "artists" CASCADE`);
        await queryRunner.query(`DROP TABLE IF EXISTS "artists_backup" CASCADE`);

        // users (referenced by legacy tickets — already dropped above)
        await queryRunner.query(`DROP TABLE IF EXISTS "users" CASCADE`);

        // venues (referenced by legacy events — already dropped above)
        await queryRunner.query(`DROP TABLE IF EXISTS "venues" CASCADE`);


        // ── 3. Drop duplicate FK constraints ─────────────────────────────────
        // Each constraint below is a duplicate of another constraint on the
        // same column that was added by AlignSchemaFix. One is kept per column.

        const dropFkIfExists = async (table: string, constraint: string) => {
            const exists = await queryRunner.query(`
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = $1 AND table_name = $2 AND constraint_type = 'FOREIGN KEY'
            `, [constraint, table]) as any[];
            if (exists && exists.length > 0) {
                await queryRunner.query(`ALTER TABLE "${table}" DROP CONSTRAINT "${constraint}"`);
            }
        };

        // event.venueId → venue.id  (keep FK_0af7bb0535bc01f3c130cfe5fe7)
        await dropFkIfExists('event', 'FK_0a7a72120769940b25f994863c7');

        // event_artist.eventId → event.id  (keep FK_0cc346514503054b3d20c3389fc)
        await dropFkIfExists('event_artist', 'FK_2813b1737b20258a4195b92b447');

        // event_artist.artistId → artist.id  (keep FK_2332057da6b96737f522d2d595f)
        await dropFkIfExists('event_artist', 'FK_1305b25c783fa4be660a9abb0a4');

        // gallery_image.eventId → event.id  (keep FK_1f961932a7ad93669194dac5562)
        await dropFkIfExists('gallery_image', 'FK_f5f91e3667915f11ff74c293f21');

        // ticket.eventId → event.id  (keep FK_8a101375d173c39a7c1d02c9d7d)
        await dropFkIfExists('ticket', 'FK_cb22a51617991265571be41b74f');

        // ticket.userId → user.id  (keep FK_4bb45e096f521845765f657f5c8)
        await dropFkIfExists('ticket', 'FK_0e01a7c92f008418bad6bad5919');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {

        // ── 3. Re-add the dropped duplicate FK constraints ───────────────────
        // Re-creating the duplicates restores the pre-migration state exactly.

        const addFkIfNotExists = async (table: string, constraint: string, definition: string) => {
            const exists = await queryRunner.query(`
                SELECT 1 FROM information_schema.table_constraints
                WHERE constraint_name = $1 AND table_name = $2 AND constraint_type = 'FOREIGN KEY'
            `, [constraint, table]) as any[];
            if (!exists || exists.length === 0) {
                await queryRunner.query(`ALTER TABLE "${table}" ADD CONSTRAINT "${constraint}" ${definition}`);
            }
        };

        await addFkIfNotExists('ticket', 'FK_0e01a7c92f008418bad6bad5919',
            `FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await addFkIfNotExists('ticket', 'FK_cb22a51617991265571be41b74f',
            `FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await addFkIfNotExists('gallery_image', 'FK_f5f91e3667915f11ff74c293f21',
            `FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await addFkIfNotExists('event_artist', 'FK_1305b25c783fa4be660a9abb0a4',
            `FOREIGN KEY ("artistId") REFERENCES "artist"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await addFkIfNotExists('event_artist', 'FK_2813b1737b20258a4195b92b447',
            `FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await addFkIfNotExists('event', 'FK_0a7a72120769940b25f994863c7',
            `FOREIGN KEY ("venueId") REFERENCES "venue"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);


        // ── 2. Recreate empty legacy tables ──────────────────────────────────

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "venues" (
                id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
                name character varying NOT NULL,
                address character varying NOT NULL,
                city character varying NOT NULL,
                state character varying NOT NULL,
                "zipCode" character varying NOT NULL,
                capacity integer NOT NULL,
                description text,
                "imageUrl" character varying,
                "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
                "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
                PRIMARY KEY (id)
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "users" (
                id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
                email character varying NOT NULL,
                password character varying NOT NULL,
                "firstName" character varying,
                "lastName" character varying,
                "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
                "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
                PRIMARY KEY (id),
                UNIQUE (email)
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "artists" (
                id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
                name character varying NOT NULL,
                bio text,
                "imageUrl" character varying,
                genre character varying,
                website character varying,
                "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
                "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
                "socialMedia" json,
                PRIMARY KEY (id)
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "artists_backup" (
                id uuid,
                name character varying,
                bio text,
                "imageUrl" character varying,
                genre character varying,
                website character varying,
                "createdAt" timestamp without time zone,
                "updatedAt" timestamp without time zone,
                "socialMedia" character varying
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "events" (
                id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
                title character varying NOT NULL,
                description text,
                date timestamp without time zone NOT NULL,
                "time" character varying NOT NULL,
                "venueId" uuid,
                "imageUrl" character varying,
                "ticketPrice" numeric(10,2),
                "maxTickets" integer,
                status character varying DEFAULT 'upcoming' NOT NULL,
                "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
                "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
                PRIMARY KEY (id)
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "contact_messages" (
                id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
                name character varying NOT NULL,
                email character varying NOT NULL,
                message text NOT NULL,
                "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
                PRIMARY KEY (id)
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "tickets" (
                id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
                "eventId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                quantity integer NOT NULL,
                "totalPrice" numeric(10,2) NOT NULL,
                status character varying DEFAULT 'active' NOT NULL,
                "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
                "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
                PRIMARY KEY (id)
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "gallery_images" (
                id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
                filename character varying NOT NULL,
                url character varying NOT NULL,
                "thumbnailUrl" character varying,
                "mediumUrl" character varying,
                "largeUrl" character varying,
                caption character varying,
                "eventId" uuid,
                photographer character varying,
                tags text,
                category character varying DEFAULT 'other' NOT NULL,
                "orderIndex" integer DEFAULT 0 NOT NULL,
                "isPublished" boolean DEFAULT false NOT NULL,
                "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
                "updatedAt" timestamp without time zone DEFAULT now() NOT NULL,
                PRIMARY KEY (id)
            )
        `);

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "event_artists" (
                id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
                "eventId" uuid NOT NULL,
                "artistId" uuid NOT NULL,
                "createdAt" timestamp without time zone DEFAULT now() NOT NULL,
                PRIMARY KEY (id)
            )
        `);


        // ── 1. Restore venue.description NOT NULL ────────────────────────────
        // Note: this will fail if any venue rows have a NULL description.
        await queryRunner.query(`ALTER TABLE "venue" ALTER COLUMN "description" SET NOT NULL`);
    }
}
