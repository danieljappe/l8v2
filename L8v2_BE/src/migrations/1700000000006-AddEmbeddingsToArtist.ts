import { MigrationInterface, QueryRunner } from "typeorm";

export class AddEmbeddingsToArtist1700000000006 implements MigrationInterface {
    name = 'AddEmbeddingsToArtist1700000000006'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if column already exists before adding it
        const hasColumn = await queryRunner.hasColumn("artist", "embeddings");
        if (!hasColumn) {
            await queryRunner.query(`ALTER TABLE "artist" ADD "embeddings" json`);
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Check if column exists before dropping it
        const hasColumn = await queryRunner.hasColumn("artist", "embeddings");
        if (hasColumn) {
            await queryRunner.query(`ALTER TABLE "artist" DROP COLUMN "embeddings"`);
        }
    }
}
