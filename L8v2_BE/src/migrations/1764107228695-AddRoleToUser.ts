import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRoleToUser1764107228695 implements MigrationInterface {
    name = 'AddRoleToUser1764107228695'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column already exists
        const columnExists = await queryRunner.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'user'
              AND column_name = 'role'
        `);

        if (!columnExists || columnExists.length === 0) {
            // Add the role column
            await queryRunner.query(`
                ALTER TABLE "user" 
                ADD COLUMN "role" character varying
            `);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists
        const columnExists = await queryRunner.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'user'
              AND column_name = 'role'
        `);

        if (columnExists && columnExists.length > 0) {
            // Drop the role column
            await queryRunner.query(`
                ALTER TABLE "user" 
                DROP COLUMN "role"
            `);
        }
    }
}





