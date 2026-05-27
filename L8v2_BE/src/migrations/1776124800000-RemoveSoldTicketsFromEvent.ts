import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveSoldTicketsFromEvent1776124800000 implements MigrationInterface {
    name = 'RemoveSoldTicketsFromEvent1776124800000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event" DROP COLUMN IF EXISTS "soldTickets"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "soldTickets" integer NOT NULL DEFAULT 0`);
    }
}
