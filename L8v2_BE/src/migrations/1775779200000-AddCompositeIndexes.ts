import { MigrationInterface, QueryRunner } from 'typeorm';

/**
 * Composite indexes for the heaviest public-facing queries.
 *
 * Problem: The home page fired 3 full-table-dump queries and filtered
 * everything client-side in JavaScript. No WHERE clause → no index can help.
 *
 * Fix: Endpoints now accept filter params (upcoming, past, bookable, eventId)
 * that push filtering into SQL. These indexes make those targeted queries fast.
 *
 * Indexes added:
 *   1. event(date, status)                    — upcoming / past event lookups
 *   2. gallery_image("eventId", "createdAt")  — gallery by event, ordered by date
 *   3. artist("isBookable")                   — bookable artist filter
 *   4. artist("bookingUserId")                — LEFT JOIN artist → user
 *   5. contact_message(email, "createdAt")    — anti-spam duplicate + rate-limit queries
 */
export class AddCompositeIndexes1775779200000 implements MigrationInterface {
  name = 'AddCompositeIndexes1775779200000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // 1. event(date, status)
    //    Covers: WHERE date >= NOW() ORDER BY date ASC LIMIT 1  (upcoming event)
    //            WHERE date < NOW()  ORDER BY date DESC LIMIT 1 (most recent past event)
    //    The leading date column means the existing IDX_event_date is made redundant;
    //    keep it for backwards compat with any plain date-only scans.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_event_date_status"
      ON event (date, status)
    `);

    // 2. gallery_image("eventId", "createdAt")
    //    Covers: WHERE "eventId" = ? ORDER BY "createdAt" ASC LIMIT 4
    //    Replaces the separate IDX_gallery_image_event for this specific query pattern.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_gallery_image_eventId_createdAt"
      ON gallery_image ("eventId", "createdAt" ASC)
    `);

    // 3. artist("isBookable")
    //    Covers: WHERE "isBookable" = true
    //    Low-cardinality boolean — partial index on true rows is most efficient.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_artist_isBookable"
      ON artist ("isBookable")
      WHERE "isBookable" = true
    `);

    // 4. artist("bookingUserId")
    //    Covers: LEFT JOIN "user" u ON u.id = a."bookingUserId"
    //    Helps the nested-loop join on the bookingUser relation.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_artist_bookingUserId"
      ON artist ("bookingUserId")
    `);

    // 5. contact_message(email, "createdAt")
    //    Covers both anti-spam queries on POST /api/contact:
    //      WHERE email = ? AND message = ? AND "createdAt" >= ?  (duplicate check)
    //      WHERE email = ? AND "createdAt" >= ?                  (rate-limit count)
    //    message is TEXT so it stays as a post-filter after the index seek.
    await queryRunner.query(`
      CREATE INDEX IF NOT EXISTS "IDX_contact_message_email_createdAt"
      ON contact_message (email, "createdAt" DESC)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_contact_message_email_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_artist_bookingUserId"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_artist_isBookable"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_gallery_image_eventId_createdAt"`);
    await queryRunner.query(`DROP INDEX IF EXISTS "IDX_event_date_status"`);
  }
}
