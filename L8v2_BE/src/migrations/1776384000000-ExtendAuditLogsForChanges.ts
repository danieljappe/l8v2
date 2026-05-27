import { MigrationInterface, QueryRunner } from "typeorm";

export class ExtendAuditLogsForChanges1776384000000 implements MigrationInterface {
    name = 'ExtendAuditLogsForChanges1776384000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "oldValues" json`);
        await queryRunner.query(`ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "newValues" json`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "newValues"`);
        await queryRunner.query(`ALTER TABLE "audit_logs" DROP COLUMN IF EXISTS "oldValues"`);
    }
}
