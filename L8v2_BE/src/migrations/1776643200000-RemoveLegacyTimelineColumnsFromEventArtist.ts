import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Contract migration — run ONLY after the API switch is live and stable in production.
 * Drops the legacy ordering columns from event_artist (now owned by event_timeline_item).
 */
export class RemoveLegacyTimelineColumnsFromEventArtist1776643200000 implements MigrationInterface {
    name = 'RemoveLegacyTimelineColumnsFromEventArtist1776643200000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_artist" DROP COLUMN IF EXISTS "performanceOrder"`);
        await queryRunner.query(`ALTER TABLE "event_artist" DROP COLUMN IF EXISTS "performanceTime"`);
        await queryRunner.query(`ALTER TABLE "event_artist" DROP COLUMN IF EXISTS "setDuration"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event_artist" ADD COLUMN "performanceOrder" INTEGER`);
        await queryRunner.query(`ALTER TABLE "event_artist" ADD COLUMN "performanceTime" CHARACTER VARYING`);
        await queryRunner.query(`ALTER TABLE "event_artist" ADD COLUMN "setDuration" INTEGER`);
    }
}
