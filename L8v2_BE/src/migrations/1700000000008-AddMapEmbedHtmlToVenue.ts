import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMapEmbedHtmlToVenue1700000000008 implements MigrationInterface {
    name = 'AddMapEmbedHtmlToVenue1700000000008'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "venue" ADD "mapEmbedHtml" text`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN "mapEmbedHtml"`);
    }
}

