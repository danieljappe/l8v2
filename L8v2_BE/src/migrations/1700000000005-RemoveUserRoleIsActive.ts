import { MigrationInterface, QueryRunner } from 'typeorm';

export class RemoveUserRoleIsActive1700000000005 implements MigrationInterface {
  name = 'RemoveUserRoleIsActive1700000000005';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "role"`);
    await queryRunner.query(`ALTER TABLE "user" DROP COLUMN IF EXISTS "isActive"`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "user" ADD "isActive" boolean DEFAULT true`);
    await queryRunner.query(`ALTER TABLE "user" ADD "role" character varying NOT NULL DEFAULT 'user'`);
  }
}

