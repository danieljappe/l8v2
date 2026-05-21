import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddEventNameToBillettoEventData1776038400000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "billetto_event_data" ADD COLUMN IF NOT EXISTS "eventName" varchar`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "billetto_event_data" DROP COLUMN IF EXISTS "eventName"`);
  }
}
