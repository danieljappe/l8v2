import { ContactMessage } from '../models/ContactMessage';
import { BaseRepository } from './BaseRepository';

export class ContactMessageRepository extends BaseRepository<ContactMessage> {
  constructor() {
    super(ContactMessage);
  }

  /**
   * Finds a duplicate submission (same email + message) within the last hour.
   * Raw SQL avoids TypeORM's local-timezone serialization bug with
   * `timestamp without time zone` columns.
   */
  async findRecentDuplicate(email: string, message: string): Promise<{ id: string } | null> {
    const [row] = await this.repository.query(
      `SELECT id FROM "contact_message" WHERE email = $1 AND message = $2 AND "createdAt" >= NOW() - INTERVAL '1 hour' LIMIT 1`,
      [email, message]
    );
    return row ?? null;
  }

  /** Counts messages from an email address within the last hour (throttle check). */
  async countRecentByEmail(email: string): Promise<number> {
    const [{ count }] = await this.repository.query(
      `SELECT COUNT(*) as count FROM "contact_message" WHERE email = $1 AND "createdAt" >= NOW() - INTERVAL '1 hour'`,
      [email]
    );
    return parseInt(count, 10);
  }
}
