import { MigrationInterface, QueryRunner } from "typeorm";

export class AddIsBookableToArtist1700000000007 implements MigrationInterface {
    name = 'AddIsBookableToArtist1700000000007'

    public async up(queryRunner: QueryRunner): Promise<void> {
        const columnExists = await queryRunner.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'artist'
              AND column_name = 'isBookable'
        `);

        if (!columnExists || columnExists.length === 0) {
            await queryRunner.query(`ALTER TABLE "artist" ADD "isBookable" boolean NOT NULL DEFAULT false`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const columnExists = await queryRunner.query(`
            SELECT column_name
            FROM information_schema.columns
            WHERE table_name = 'artist'
              AND column_name = 'isBookable'
        `);

        if (columnExists && columnExists.length > 0) {
            await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN "isBookable"`);
        }
    }
}
