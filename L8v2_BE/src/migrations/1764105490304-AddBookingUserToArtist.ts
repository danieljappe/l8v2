import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBookingUserToArtist1764105490304 implements MigrationInterface {
    name = 'AddBookingUserToArtist1764105490304'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column already exists
        const columnExists = await queryRunner.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'artist'
              AND column_name = 'bookingUserId'
        `);

        if (!columnExists || columnExists.length === 0) {
            // Add the bookingUserId column
            await queryRunner.query(`
                ALTER TABLE "artist" 
                ADD "bookingUserId" uuid
            `);
        }

        // Check if foreign key constraint already exists
        const constraintExists = await queryRunner.query(`
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = 'artist'
              AND constraint_type = 'FOREIGN KEY'
              AND constraint_name LIKE '%bookingUserId%'
        `);

        if (!constraintExists || constraintExists.length === 0) {
            // Add foreign key constraint
            await queryRunner.query(`
                ALTER TABLE "artist" 
                ADD CONSTRAINT "FK_artist_booking_user" 
                FOREIGN KEY ("bookingUserId") 
                REFERENCES "user"("id") 
                ON DELETE SET NULL 
                ON UPDATE NO ACTION
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if foreign key constraint exists
        const constraintExists = await queryRunner.query(`
            SELECT constraint_name
            FROM information_schema.table_constraints
            WHERE table_name = 'artist'
              AND constraint_type = 'FOREIGN KEY'
              AND constraint_name = 'FK_artist_booking_user'
        `);

        if (constraintExists && constraintExists.length > 0) {
            // Drop foreign key constraint
            await queryRunner.query(`
                ALTER TABLE "artist" 
                DROP CONSTRAINT "FK_artist_booking_user"
            `);
        }

        // Check if column exists
        const columnExists = await queryRunner.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'artist'
              AND column_name = 'bookingUserId'
        `);

        if (columnExists && columnExists.length > 0) {
            // Drop the bookingUserId column
            await queryRunner.query(`
                ALTER TABLE "artist" 
                DROP COLUMN "bookingUserId"
            `);
        }
    }
}

