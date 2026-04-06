import { MigrationInterface, QueryRunner } from "typeorm";

export class MakeBillettoEventIdNullable1775692800000 implements MigrationInterface {
    name = 'MakeBillettoEventIdNullable1775692800000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "billetto_event_data" ALTER COLUMN "eventId" DROP NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DELETE FROM "billetto_event_data" WHERE "eventId" IS NULL`);
        await queryRunner.query(`ALTER TABLE "billetto_event_data" ALTER COLUMN "eventId" SET NOT NULL`);
    }
}
