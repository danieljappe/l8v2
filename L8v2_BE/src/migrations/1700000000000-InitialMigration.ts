import { MigrationInterface, QueryRunner } from "typeorm";

export class InitialMigration1700000000000 implements MigrationInterface {
    name = 'InitialMigration1700000000000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Create users table
        await queryRunner.query(`
            CREATE TABLE "user" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "password" character varying NOT NULL,
                "firstName" character varying,
                "lastName" character varying,
                "role" character varying NOT NULL DEFAULT 'user',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "UQ_97672ac88f789774dd47f7c8be3" UNIQUE ("email"),
                CONSTRAINT "PK_a3ffb1c0c8416b9fc6f907b7433" PRIMARY KEY ("id")
            )
        `);

        // Create venues table
        await queryRunner.query(`
            CREATE TABLE "venue" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "address" character varying NOT NULL,
                "city" character varying NOT NULL,
                "state" character varying NOT NULL,
                "zipCode" character varying NOT NULL,
                "capacity" integer NOT NULL,
                "description" text,
                "imageUrl" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_8b2b0c3c3c3c3c3c3c3c3c3c3c" PRIMARY KEY ("id")
            )
        `);

        // Create artists table
        await queryRunner.query(`
            CREATE TABLE "artist" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "bio" text,
                "imageUrl" character varying,
                "genre" character varying,
                "website" character varying,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_8b2b0c3c3c3c3c3c3c3c3c3c4" PRIMARY KEY ("id")
            )
        `);

        // Create events table
        await queryRunner.query(`
            CREATE TABLE "event" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "title" character varying NOT NULL,
                "description" text,
                "date" TIMESTAMP NOT NULL,
                "time" character varying NOT NULL,
                "venueId" uuid,
                "imageUrl" character varying,
                "ticketPrice" decimal(10,2),
                "maxTickets" integer,
                "status" character varying NOT NULL DEFAULT 'upcoming',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_8b2b0c3c3c3c3c3c3c3c3c3c5" PRIMARY KEY ("id")
            )
        `);

        // Create tickets table
        await queryRunner.query(`
            CREATE TABLE "ticket" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "eventId" uuid NOT NULL,
                "userId" uuid NOT NULL,
                "quantity" integer NOT NULL,
                "totalPrice" decimal(10,2) NOT NULL,
                "status" character varying NOT NULL DEFAULT 'active',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_8b2b0c3c3c3c3c3c3c3c3c3c6" PRIMARY KEY ("id")
            )
        `);

        // Create gallery_images table
        await queryRunner.query(`
            CREATE TABLE "gallery_image" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "eventId" uuid,
                "imageUrl" character varying NOT NULL,
                "caption" character varying,
                "uploadedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_8b2b0c3c3c3c3c3c3c3c3c3c7" PRIMARY KEY ("id")
            )
        `);

        // Create contact_messages table
        await queryRunner.query(`
            CREATE TABLE "contact_message" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "email" character varying NOT NULL,
                "message" text NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_8b2b0c3c3c3c3c3c3c3c3c3c8" PRIMARY KEY ("id")
            )
        `);

        // Create event_artists table
        await queryRunner.query(`
            CREATE TABLE "event_artist" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "eventId" uuid NOT NULL,
                "artistId" uuid NOT NULL,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_8b2b0c3c3c3c3c3c3c3c3c3c9" PRIMARY KEY ("id")
            )
        `);

        // Add foreign key constraints
        await queryRunner.query(`
            ALTER TABLE "event" 
            ADD CONSTRAINT "FK_events_venue" 
            FOREIGN KEY ("venueId") REFERENCES "venue"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "ticket" 
            ADD CONSTRAINT "FK_tickets_event" 
            FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "ticket" 
            ADD CONSTRAINT "FK_tickets_user" 
            FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "gallery_image" 
            ADD CONSTRAINT "FK_gallery_images_event" 
            FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE SET NULL ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "event_artist" 
            ADD CONSTRAINT "FK_event_artists_event" 
            FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        await queryRunner.query(`
            ALTER TABLE "event_artist" 
            ADD CONSTRAINT "FK_event_artists_artist" 
            FOREIGN KEY ("artistId") REFERENCES "artist"("id") ON DELETE CASCADE ON UPDATE NO ACTION
        `);

        // Create indexes for better performance
        await queryRunner.query(`CREATE INDEX "IDX_event_date" ON "event" ("date")`);
        await queryRunner.query(`CREATE INDEX "IDX_event_venue" ON "event" ("venueId")`);
        await queryRunner.query(`CREATE INDEX "IDX_ticket_event" ON "ticket" ("eventId")`);
        await queryRunner.query(`CREATE INDEX "IDX_ticket_user" ON "ticket" ("userId")`);
        await queryRunner.query(`CREATE INDEX "IDX_gallery_image_event" ON "gallery_image" ("eventId")`);
        await queryRunner.query(`CREATE INDEX "IDX_event_artist_event" ON "event_artist" ("eventId")`);
        await queryRunner.query(`CREATE INDEX "IDX_event_artist_artist" ON "event_artist" ("artistId")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop foreign key constraints first
        await queryRunner.query(`ALTER TABLE "event_artist" DROP CONSTRAINT "FK_event_artists_artist"`);
        await queryRunner.query(`ALTER TABLE "event_artist" DROP CONSTRAINT "FK_event_artists_event"`);
        await queryRunner.query(`ALTER TABLE "gallery_image" DROP CONSTRAINT "FK_gallery_images_event"`);
        await queryRunner.query(`ALTER TABLE "ticket" DROP CONSTRAINT "FK_tickets_user"`);
        await queryRunner.query(`ALTER TABLE "ticket" DROP CONSTRAINT "FK_tickets_event"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_events_venue"`);

        // Drop indexes
        await queryRunner.query(`DROP INDEX "IDX_event_artist_artist"`);
        await queryRunner.query(`DROP INDEX "IDX_event_artist_event"`);
        await queryRunner.query(`DROP INDEX "IDX_gallery_image_event"`);
        await queryRunner.query(`DROP INDEX "IDX_ticket_user"`);
        await queryRunner.query(`DROP INDEX "IDX_ticket_event"`);
        await queryRunner.query(`DROP INDEX "IDX_event_venue"`);
        await queryRunner.query(`DROP INDEX "IDX_event_date"`);

        // Drop tables
        await queryRunner.query(`DROP TABLE "event_artist"`);
        await queryRunner.query(`DROP TABLE "contact_message"`);
        await queryRunner.query(`DROP TABLE "gallery_image"`);
        await queryRunner.query(`DROP TABLE "ticket"`);
        await queryRunner.query(`DROP TABLE "event"`);
        await queryRunner.query(`DROP TABLE "artist"`);
        await queryRunner.query(`DROP TABLE "venue"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }
}
