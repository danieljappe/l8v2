import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateArtistModel1700000000002 implements MigrationInterface {
    name = 'UpdateArtistModel1700000000002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add missing columns to artists table
        await queryRunner.query(`
            ALTER TABLE "artist" 
            ADD COLUMN "socialMedia" character varying,
            ADD COLUMN "rating" float DEFAULT 0,
            ADD COLUMN "isActive" boolean DEFAULT true
        `);
        
        // Drop old columns if they exist (from old model)
        try {
            await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN IF EXISTS "email"`);
            await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN IF EXISTS "phone"`);
            await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN IF EXISTS "image"`);
            await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN IF EXISTS "eventsCount"`);
        } catch (error) {
            // Columns might not exist, ignore errors
            console.log('Some old columns were already removed or never existed');
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Remove new columns
        await queryRunner.query(`
            ALTER TABLE "artist" 
            DROP COLUMN IF EXISTS "socialMedia",
            DROP COLUMN IF EXISTS "rating",
            DROP COLUMN IF EXISTS "isActive"
        `);
        
        // Restore old columns
        await queryRunner.query(`
            ALTER TABLE "artist" 
            ADD COLUMN "email" character varying DEFAULT '',
            ADD COLUMN "phone" character varying DEFAULT '',
            ADD COLUMN "image" character varying DEFAULT '',
            ADD COLUMN "eventsCount" integer DEFAULT 0
        `);
    }
}
