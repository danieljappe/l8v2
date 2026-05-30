import { ContactMessage, MessageStatus } from '../models/ContactMessage';
import { BaseRepository } from './BaseRepository';
import { FindOptionsWhere, Between } from 'typeorm';

export class ContactMessageRepository extends BaseRepository<ContactMessage> {
  constructor() {
    super(ContactMessage);
  }

  async findByEmail(email: string): Promise<ContactMessage[]> {
    return this.repository.findBy({
      email
    } as FindOptionsWhere<ContactMessage>);
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

  async findUnreadMessages(): Promise<ContactMessage[]> {
    return this.repository.findBy({
      isRead: false
    } as FindOptionsWhere<ContactMessage>);
  }

  async findReadMessages(): Promise<ContactMessage[]> {
    return this.repository.findBy({
      isRead: true
    } as FindOptionsWhere<ContactMessage>);
  }

  async findByStatus(status: MessageStatus): Promise<ContactMessage[]> {
    return this.repository.findBy({
      status
    } as FindOptionsWhere<ContactMessage>);
  }

  async findPendingMessages(): Promise<ContactMessage[]> {
    return this.repository.findBy({
      status: MessageStatus.PENDING
    } as FindOptionsWhere<ContactMessage>);
  }

  async findRepliedMessages(): Promise<ContactMessage[]> {
    return this.repository.findBy({
      status: MessageStatus.REPLIED
    } as FindOptionsWhere<ContactMessage>);
  }

  async findMessagesByDateRange(startDate: Date, endDate: Date): Promise<ContactMessage[]> {
    return this.repository.findBy({
      createdAt: Between(startDate, endDate)
    } as FindOptionsWhere<ContactMessage>);
  }
} 