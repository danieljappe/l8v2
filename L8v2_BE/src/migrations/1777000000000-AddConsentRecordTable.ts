import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Cookie-consent proof log.
 *
 * - No IP / user-agent columns, by design.
 * - No audit trigger: audit_logs has no retention, so auditing this table would
 *   preserve every consent row beyond the 24-month purge.
 * - BRIN index on created_at: the table is append-only in time order, which is
 *   exactly BRIN's sweet spot — a tiny index that still prunes the retention
 *   DELETE to the old block ranges.
 * - purge_expired_consent_records() owns the retention rule in the database,
 *   so the in-process job, a cron entry and a DBA all delete the same rows.
 */
export class AddConsentRecordTable1777000000000 implements MigrationInterface {
  name = 'AddConsentRecordTable1777000000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "consent_record" (
        "id"              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
        "consent_id"      UUID        NOT NULL,
        "consent_version" INTEGER     NOT NULL CHECK ("consent_version" > 0),
        "statistics"      BOOLEAN     NOT NULL,
        "external_media"  BOOLEAN     NOT NULL,
        "created_at"      TIMESTAMPTZ NOT NULL DEFAULT now()
      )
    `);

    await queryRunner.query(`
      COMMENT ON TABLE "consent_record" IS
        'Proof of cookie consent. Holds no IP address or user-agent by design. Rows older than 24 months are deleted by purge_expired_consent_records(). Intentionally excluded from the log_change() audit trigger.'
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_consent_record_consent_id" ON "consent_record" ("consent_id")
    `);
    await queryRunner.query(`
      CREATE INDEX "idx_consent_record_created_at_brin" ON "consent_record" USING BRIN ("created_at")
    `);

    await queryRunner.query(`
      CREATE OR REPLACE FUNCTION purge_expired_consent_records(retention INTERVAL DEFAULT INTERVAL '24 months')
      RETURNS INTEGER AS $$
      DECLARE
          deleted INTEGER;
      BEGIN
          DELETE FROM "consent_record" WHERE "created_at" < now() - retention;
          GET DIAGNOSTICS deleted = ROW_COUNT;
          RETURN deleted;
      END;
      $$ LANGUAGE plpgsql
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP FUNCTION IF EXISTS purge_expired_consent_records(INTERVAL)`);
    await queryRunner.query(`DROP TABLE IF EXISTS "consent_record"`);
  }
}
