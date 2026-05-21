import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddMaxCapacityToEvent1775952000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event" ADD COLUMN IF NOT EXISTS "maxCapacity" integer`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "event" DROP COLUMN IF EXISTS "maxCapacity"`);
  }
}
