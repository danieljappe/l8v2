import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index } from 'typeorm';

/**
 * Proof of a cookie-consent decision (GDPR art. 7(1): the controller must be
 * able to demonstrate consent).
 *
 * Deliberately minimal: a random id generated in the visitor's browser, the
 * choices, the banner version and the time. No IP address, no user-agent, no
 * user id — nothing that identifies the visitor beyond the random id.
 *
 * Not covered by the log_change() audit trigger: the audit log has no
 * retention, so auditing this table would keep every row past the 24-month
 * purge (see purge_expired_consent_records()).
 */
@Entity('consent_record')
@Index('idx_consent_record_consent_id', ['consentId'])
// BRIN on created_at, created by the migration. Rows arrive in time order, so
// a BRIN index is a few pages in size and still lets the retention DELETE skip
// everything newer than the cut-off. synchronize:false because TypeORM cannot
// express the index method.
@Index('idx_consent_record_created_at_brin', { synchronize: false })
export class ConsentRecord {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ name: 'consent_id', type: 'uuid' })
  consentId!: string;

  @Column({ name: 'consent_version', type: 'integer' })
  consentVersion!: number;

  @Column({ type: 'boolean' })
  statistics!: boolean;

  @Column({ name: 'external_media', type: 'boolean' })
  externalMedia!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;
}
