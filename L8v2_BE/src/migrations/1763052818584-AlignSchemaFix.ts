import { MigrationInterface, QueryRunner } from "typeorm";

export class AlignSchemaFix1763052818584 implements MigrationInterface {
    name = 'AlignSchemaFix1763052818584'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Helper function to safely drop constraint using DO block
        const dropConstraintSafely = async (tableName: string, constraintName: string) => {
            await queryRunner.query(`
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.table_constraints 
                        WHERE constraint_name = '${constraintName}' 
                        AND table_name = '${tableName}'
                    ) THEN
                        EXECUTE 'ALTER TABLE "${tableName}" DROP CONSTRAINT "${constraintName}"';
                    END IF;
                END $$;
            `);
        };

        // Drop constraints safely (only if they exist)
        await dropConstraintSafely('event_artist', 'FK_event_artists_event');
        await dropConstraintSafely('event_artist', 'FK_event_artists_artist');
        await dropConstraintSafely('gallery_image', 'FK_gallery_images_event');
        await dropConstraintSafely('event', 'FK_events_venue');
        await dropConstraintSafely('ticket', 'FK_tickets_event');
        await dropConstraintSafely('ticket', 'FK_tickets_user');
        
        // Drop indexes if they exist (using IF EXISTS for safety)
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_event_artist_event"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_event_artist_artist"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_event_date"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_event_venue"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_ticket_event"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "public"."IDX_ticket_user"`);
        
        // Helper function to safely add column if it doesn't exist
        const addColumnIfNotExists = async (tableName: string, columnName: string, columnDefinition: string) => {
            const hasColumn = await queryRunner.hasColumn(tableName, columnName);
            if (!hasColumn) {
                await queryRunner.query(`ALTER TABLE "${tableName}" ADD ${columnDefinition}`);
            }
        };

        // Helper function to safely alter column if it exists
        const alterColumnIfExists = async (tableName: string, columnName: string, alteration: string) => {
            const hasColumn = await queryRunner.hasColumn(tableName, columnName);
            if (hasColumn) {
                await queryRunner.query(`ALTER TABLE "${tableName}" ALTER COLUMN "${columnName}" ${alteration}`);
            }
        };

        // Helper function to safely add constraint if it doesn't exist
        const addConstraintIfNotExists = async (tableName: string, constraintName: string, constraintDefinition: string) => {
            const constraintExists = await queryRunner.query(`
                SELECT 1 FROM information_schema.table_constraints 
                WHERE constraint_name = $1 AND table_name = $2
            `, [constraintName, tableName]) as any[];
            
            if (!constraintExists || constraintExists.length === 0) {
                await queryRunner.query(`ALTER TABLE "${tableName}" ADD CONSTRAINT "${constraintName}" ${constraintDefinition}`);
            }
        };

        // Drop columns if they exist
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN IF EXISTS "time"`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN IF EXISTS "maxTickets"`);
        await queryRunner.query(`ALTER TABLE "ticket" DROP COLUMN IF EXISTS "totalPrice"`);
        await queryRunner.query(`ALTER TABLE "ticket" DROP COLUMN IF EXISTS "status"`);
        
        // Add columns safely (only if they don't exist)
        await addColumnIfNotExists('venue', 'country', '"country" character varying');
        await addColumnIfNotExists('venue', 'images', '"images" text');
        await addColumnIfNotExists('venue', 'isActive', '"isActive" boolean NOT NULL DEFAULT true');
        await addColumnIfNotExists('venue', 'latitude', '"latitude" double precision');
        await addColumnIfNotExists('venue', 'longitude', '"longitude" double precision');
        await addColumnIfNotExists('event_artist', 'performanceOrder', '"performanceOrder" integer');
        await addColumnIfNotExists('event_artist', 'performanceTime', '"performanceTime" character varying');
        await addColumnIfNotExists('event_artist', 'setDuration', '"setDuration" integer');
        await addColumnIfNotExists('event_artist', 'fee', '"fee" integer');
        await addColumnIfNotExists('event_artist', 'updatedAt', '"updatedAt" TIMESTAMP NOT NULL DEFAULT now()');
        await addColumnIfNotExists('event', 'startTime', '"startTime" character varying NOT NULL');
        await addColumnIfNotExists('event', 'endTime', '"endTime" character varying');
        await addColumnIfNotExists('event', 'totalTickets', '"totalTickets" integer NOT NULL');
        await addColumnIfNotExists('event', 'soldTickets', '"soldTickets" integer NOT NULL DEFAULT \'0\'');
        await addColumnIfNotExists('event', 'isActive', '"isActive" boolean NOT NULL DEFAULT true');
        await addColumnIfNotExists('event', 'capacity', '"capacity" integer');
        await addColumnIfNotExists('event', 'currentAttendees', '"currentAttendees" integer NOT NULL DEFAULT \'0\'');
        await addColumnIfNotExists('ticket', 'ticketNumber', '"ticketNumber" character varying NOT NULL');
        await addColumnIfNotExists('ticket', 'price', '"price" integer NOT NULL');
        await addColumnIfNotExists('ticket', 'isUsed', '"isUsed" boolean NOT NULL DEFAULT false');
        await addColumnIfNotExists('ticket', 'usedAt', '"usedAt" TIMESTAMP');
        await addColumnIfNotExists('ticket', 'isActive', '"isActive" boolean NOT NULL DEFAULT true');
        await addColumnIfNotExists('ticket', 'sold', '"sold" integer NOT NULL DEFAULT \'0\'');
        await addColumnIfNotExists('ticket', 'saleStartDate', '"saleStartDate" TIMESTAMP');
        await addColumnIfNotExists('ticket', 'saleEndDate', '"saleEndDate" TIMESTAMP');
        await addColumnIfNotExists('user', 'phoneNumber', '"phoneNumber" character varying');
        await addColumnIfNotExists('user', 'address', '"address" character varying');
        await addColumnIfNotExists('user', 'isActive', '"isActive" boolean NOT NULL DEFAULT true');
        await addColumnIfNotExists('contact_message', 'isRead', '"isRead" boolean NOT NULL DEFAULT false');
        
        // Create enum types if they don't exist
        const contactTypeEnumExists = await queryRunner.query(`
            SELECT 1 FROM pg_type WHERE typname = 'contact_message_type_enum'
        `) as any[];
        if (!contactTypeEnumExists || contactTypeEnumExists.length === 0) {
            await queryRunner.query(`CREATE TYPE "public"."contact_message_type_enum" AS ENUM('general', 'booking', 'support', 'feedback')`);
        }
        
        await addColumnIfNotExists('contact_message', 'type', '"type" "public"."contact_message_type_enum" NOT NULL DEFAULT \'general\'');
        
        const contactStatusEnumExists = await queryRunner.query(`
            SELECT 1 FROM pg_type WHERE typname = 'contact_message_status_enum'
        `) as any[];
        if (!contactStatusEnumExists || contactStatusEnumExists.length === 0) {
            await queryRunner.query(`CREATE TYPE "public"."contact_message_status_enum" AS ENUM('pending', 'read', 'replied', 'archived')`);
        }
        
        await addColumnIfNotExists('contact_message', 'status', '"status" "public"."contact_message_status_enum" NOT NULL DEFAULT \'pending\'');
        await addColumnIfNotExists('contact_message', 'phone', '"phone" character varying');
        await addColumnIfNotExists('contact_message', 'subject', '"subject" character varying');
        await addColumnIfNotExists('contact_message', 'eventDate', '"eventDate" TIMESTAMP');
        await addColumnIfNotExists('contact_message', 'artistType', '"artistType" character varying');
        await addColumnIfNotExists('contact_message', 'eventDetails', '"eventDetails" text');
        await addColumnIfNotExists('contact_message', 'budget', '"budget" integer');
        await addColumnIfNotExists('contact_message', 'adminNotes', '"adminNotes" text');
        await addColumnIfNotExists('contact_message', 'repliedAt', '"repliedAt" TIMESTAMP');
        await addColumnIfNotExists('contact_message', 'updatedAt', '"updatedAt" TIMESTAMP NOT NULL DEFAULT now()');
        
        // Alter columns safely (only if they exist)
        await alterColumnIfExists('venue', 'description', 'SET NOT NULL');
        await alterColumnIfExists('venue', 'city', 'DROP NOT NULL');
        await alterColumnIfExists('venue', 'state', 'DROP NOT NULL');
        await alterColumnIfExists('venue', 'zipCode', 'DROP NOT NULL');
        await alterColumnIfExists('venue', 'capacity', 'DROP NOT NULL');
        await alterColumnIfExists('event_artist', 'eventId', 'DROP NOT NULL');
        await alterColumnIfExists('event_artist', 'artistId', 'DROP NOT NULL');
        await queryRunner.query(`ALTER TABLE "gallery_image" DROP COLUMN IF EXISTS "category"`);
        
        // Create enum type if it doesn't exist
        const galleryCategoryEnumExists = await queryRunner.query(`
            SELECT 1 FROM pg_type WHERE typname = 'gallery_image_category_enum'
        `) as any[];
        if (!galleryCategoryEnumExists || galleryCategoryEnumExists.length === 0) {
            await queryRunner.query(`CREATE TYPE "public"."gallery_image_category_enum" AS ENUM('event', 'venue', 'artist', 'other')`);
        }
        
        await addColumnIfNotExists('gallery_image', 'category', '"category" "public"."gallery_image_category_enum" NOT NULL DEFAULT \'other\'');
        
        // Alter columns safely (only if they exist)
        await alterColumnIfExists('event', 'description', 'SET NOT NULL');
        await alterColumnIfExists('event', 'ticketPrice', 'SET NOT NULL');
        await alterColumnIfExists('event', 'status', 'SET DEFAULT \'draft\'');
        await alterColumnIfExists('ticket', 'quantity', 'DROP NOT NULL');
        await alterColumnIfExists('ticket', 'eventId', 'DROP NOT NULL');
        await alterColumnIfExists('ticket', 'userId', 'DROP NOT NULL');
        await alterColumnIfExists('user', 'firstName', 'SET NOT NULL');
        await alterColumnIfExists('user', 'lastName', 'SET NOT NULL');
        
        // Add constraints safely (only if they don't exist)
        await addConstraintIfNotExists('event_artist', 'FK_0cc346514503054b3d20c3389fc', 'FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
        await addConstraintIfNotExists('event_artist', 'FK_2332057da6b96737f522d2d595f', 'FOREIGN KEY ("artistId") REFERENCES "artist"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
        await addConstraintIfNotExists('gallery_image', 'FK_1f961932a7ad93669194dac5562', 'FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
        await addConstraintIfNotExists('event', 'FK_0af7bb0535bc01f3c130cfe5fe7', 'FOREIGN KEY ("venueId") REFERENCES "venue"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
        await addConstraintIfNotExists('ticket', 'FK_8a101375d173c39a7c1d02c9d7d', 'FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
        await addConstraintIfNotExists('ticket', 'FK_4bb45e096f521845765f657f5c8', 'FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "ticket" DROP CONSTRAINT "FK_4bb45e096f521845765f657f5c8"`);
        await queryRunner.query(`ALTER TABLE "ticket" DROP CONSTRAINT "FK_8a101375d173c39a7c1d02c9d7d"`);
        await queryRunner.query(`ALTER TABLE "event" DROP CONSTRAINT "FK_0af7bb0535bc01f3c130cfe5fe7"`);
        await queryRunner.query(`ALTER TABLE "gallery_image" DROP CONSTRAINT "FK_1f961932a7ad93669194dac5562"`);
        await queryRunner.query(`ALTER TABLE "event_artist" DROP CONSTRAINT "FK_2332057da6b96737f522d2d595f"`);
        await queryRunner.query(`ALTER TABLE "event_artist" DROP CONSTRAINT "FK_0cc346514503054b3d20c3389fc"`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "lastName" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "user" ALTER COLUMN "firstName" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "userId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "eventId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "ticket" ALTER COLUMN "quantity" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "event" ALTER COLUMN "status" SET DEFAULT 'upcoming'`);
        await queryRunner.query(`ALTER TABLE "event" ALTER COLUMN "ticketPrice" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "event" ALTER COLUMN "description" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "gallery_image" DROP COLUMN "category"`);
        await queryRunner.query(`DROP TYPE "public"."gallery_image_category_enum"`);
        await queryRunner.query(`ALTER TABLE "gallery_image" ADD "category" character varying NOT NULL DEFAULT 'other'`);
        await queryRunner.query(`ALTER TABLE "event_artist" ALTER COLUMN "artistId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "event_artist" ALTER COLUMN "eventId" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "venue" ALTER COLUMN "capacity" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "venue" ALTER COLUMN "zipCode" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "venue" ALTER COLUMN "state" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "venue" ALTER COLUMN "city" SET NOT NULL`);
        await queryRunner.query(`ALTER TABLE "venue" ALTER COLUMN "description" DROP NOT NULL`);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN "repliedAt"`);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN "adminNotes"`);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN "budget"`);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN "eventDetails"`);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN "artistType"`);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN "eventDate"`);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN "subject"`);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN "status"`);
        await queryRunner.query(`DROP TYPE "public"."contact_message_status_enum"`);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN "type"`);
        await queryRunner.query(`DROP TYPE "public"."contact_message_type_enum"`);
        await queryRunner.query(`ALTER TABLE "contact_message" DROP COLUMN "isRead"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "user" DROP COLUMN "phoneNumber"`);
        await queryRunner.query(`ALTER TABLE "ticket" DROP COLUMN "saleEndDate"`);
        await queryRunner.query(`ALTER TABLE "ticket" DROP COLUMN "saleStartDate"`);
        await queryRunner.query(`ALTER TABLE "ticket" DROP COLUMN "sold"`);
        await queryRunner.query(`ALTER TABLE "ticket" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "ticket" DROP COLUMN "usedAt"`);
        await queryRunner.query(`ALTER TABLE "ticket" DROP COLUMN "isUsed"`);
        await queryRunner.query(`ALTER TABLE "ticket" DROP COLUMN "price"`);
        await queryRunner.query(`ALTER TABLE "ticket" DROP COLUMN "ticketNumber"`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "currentAttendees"`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "capacity"`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "soldTickets"`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "totalTickets"`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "endTime"`);
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "startTime"`);
        await queryRunner.query(`ALTER TABLE "event_artist" DROP COLUMN "updatedAt"`);
        await queryRunner.query(`ALTER TABLE "event_artist" DROP COLUMN "fee"`);
        await queryRunner.query(`ALTER TABLE "event_artist" DROP COLUMN "setDuration"`);
        await queryRunner.query(`ALTER TABLE "event_artist" DROP COLUMN "performanceTime"`);
        await queryRunner.query(`ALTER TABLE "event_artist" DROP COLUMN "performanceOrder"`);
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN "latitude"`);
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN "images"`);
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN "country"`);
        await queryRunner.query(`ALTER TABLE "ticket" ADD "status" character varying NOT NULL DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE "ticket" ADD "totalPrice" numeric(10,2) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "event" ADD "maxTickets" integer`);
        await queryRunner.query(`ALTER TABLE "event" ADD "time" character varying NOT NULL`);
        await queryRunner.query(`CREATE INDEX "IDX_ticket_user" ON "ticket" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ticket_event" ON "ticket" ("eventId") `);
        await queryRunner.query(`CREATE INDEX "IDX_event_venue" ON "event" ("venueId") `);
        await queryRunner.query(`CREATE INDEX "IDX_event_date" ON "event" ("date") `);
        await queryRunner.query(`CREATE INDEX "IDX_event_artist_artist" ON "event_artist" ("artistId") `);
        await queryRunner.query(`CREATE INDEX "IDX_event_artist_event" ON "event_artist" ("eventId") `);
        await queryRunner.query(`ALTER TABLE "ticket" ADD CONSTRAINT "FK_tickets_user" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "ticket" ADD CONSTRAINT "FK_tickets_event" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event" ADD CONSTRAINT "FK_events_venue" FOREIGN KEY ("venueId") REFERENCES "venue"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "gallery_image" ADD CONSTRAINT "FK_gallery_images_event" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_artist" ADD CONSTRAINT "FK_event_artists_artist" FOREIGN KEY ("artistId") REFERENCES "artist"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_artist" ADD CONSTRAINT "FK_event_artists_event" FOREIGN KEY ("eventId") REFERENCES "event"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

}
