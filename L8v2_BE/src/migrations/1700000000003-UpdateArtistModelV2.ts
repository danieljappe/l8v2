import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateArtistModelV21700000000003 implements MigrationInterface {
    name = 'UpdateArtistModelV21700000000003'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remove rating and isActive columns
        await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN IF EXISTS "rating"`);
        await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN IF EXISTS "isActive"`);
        
        // Change socialMedia from varchar to JSON
        // First, backup existing data
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "artist_backup" AS 
            SELECT * FROM "artist"
        `);
        
        // Drop the old socialMedia column
        await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN IF EXISTS "socialMedia"`);
        
        // Add the new JSON socialMedia column
        await queryRunner.query(`
            ALTER TABLE "artist" 
            ADD COLUMN "socialMedia" JSON
        `);
        
        // Convert existing social media data to new format if any exists
        // This will be empty for now, but the structure is ready
        console.log('Artist model updated: removed rating/isActive, changed socialMedia to JSON');
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Restore rating and isActive columns
        await queryRunner.query(`
            ALTER TABLE "artist" 
            ADD COLUMN "rating" float DEFAULT 0,
            ADD COLUMN "isActive" boolean DEFAULT true
        `);
        
        // Change socialMedia back to varchar
        await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN IF EXISTS "socialMedia"`);
        await queryRunner.query(`
            ALTER TABLE "artist" 
            ADD COLUMN "socialMedia" character varying
        `);
        
        // Restore data from backup if needed
        console.log('Artist model reverted to previous version');
    }
}
