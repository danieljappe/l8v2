import { MigrationInterface, QueryRunner } from "typeorm";

export class AddImageUrlToUser1764105958340 implements MigrationInterface {
    name = 'AddImageUrlToUser1764105958340'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column already exists
        const columnExists = await queryRunner.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'user'
              AND column_name = 'imageUrl'
        `);

        if (!columnExists || columnExists.length === 0) {
            // Add the imageUrl column
            await queryRunner.query(`
                ALTER TABLE "user" 
                ADD COLUMN "imageUrl" character varying
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists
        const columnExists = await queryRunner.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'user'
              AND column_name = 'imageUrl'
        `);

        if (columnExists && columnExists.length > 0) {
            // Drop the imageUrl column
            await queryRunner.query(`
                ALTER TABLE "user" 
                DROP COLUMN "imageUrl"
            `);
        }
    }
}





