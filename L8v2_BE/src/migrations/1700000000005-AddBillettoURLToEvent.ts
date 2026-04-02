import { MigrationInterface, QueryRunner } from "typeorm";

export class AddBillettoURLToEvent1700000000005 implements MigrationInterface {
    name = 'AddBillettoURLToEvent1700000000005'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column already exists before adding it
        const hasColumn = await queryRunner.hasColumn("event", "billettoURL");
        if (!hasColumn) {
            await queryRunner.query(`ALTER TABLE "event" ADD "billettoURL" character varying`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists before dropping it
        const hasColumn = await queryRunner.hasColumn("event", "billettoURL");
        if (hasColumn) {
            await queryRunner.query(`ALTER TABLE "event" DROP COLUMN "billettoURL"`);
        }
    }
}
