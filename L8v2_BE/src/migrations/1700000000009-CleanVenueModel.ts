import { MigrationInterface, QueryRunner } from "typeorm";

export class CleanVenueModel1700000000009 implements MigrationInterface {
    name = 'CleanVenueModel1700000000009'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN "latitude"`);
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN "longitude"`);
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN "isActive"`);
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN "zipCode"`);
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN "country"`);
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN "state"`);
        await queryRunner.query(`ALTER TABLE "venue" DROP COLUMN "capacity"`);
        await queryRunner.query(`ALTER TABLE "venue" ALTER COLUMN "description" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "venue" ADD "latitude" double precision`);
        await queryRunner.query(`ALTER TABLE "venue" ADD "longitude" double precision`);
        await queryRunner.query(`ALTER TABLE "venue" ADD "isActive" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "venue" ADD "zipCode" character varying`);
        await queryRunner.query(`ALTER TABLE "venue" ADD "country" character varying`);
        await queryRunner.query(`ALTER TABLE "venue" ADD "state" character varying`);
        await queryRunner.query(`ALTER TABLE "venue" ADD "capacity" integer`);
        await queryRunner.query(`ALTER TABLE "venue" ALTER COLUMN "description" SET NOT NULL`);
    }
}

