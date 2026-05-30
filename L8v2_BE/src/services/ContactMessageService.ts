import { DeepPartial } from 'typeorm';
import { ContactMessage } from '../models/ContactMessage';
import { ContactMessageRepository } from '../repositories/ContactMessageRepository';

export type CreateContactMessageResult =
  | { status: 'invalid'; message: string }
  | { status: 'duplicate' }
  | { status: 'throttled' }
  | { status: 'created'; contactMessage: ContactMessage };

// Spam patterns are logged for admin review but do not block submission.
const SPAM_PATTERNS = [
  /(?:https?:\/\/)?(?:www\.)?(?:bit\.ly|tinyurl|t\.co|goo\.gl|short\.link)/i, // URL shorteners
  /(?:buy|cheap|discount|offer|deal|sale).*(?:now|today|limited)/i, // Common spam keywords
  /(?:click here|visit now|act now|order now)/i,
  /(?:free money|make money|earn money|get rich)/i,
];

export class ContactMessageService {
  private repository: ContactMessageRepository;

  constructor() {
    this.repository = new ContactMessageRepository();
  }

  /**
   * Validates, trims, de-duplicates and throttles a public contact submission,
   * then persists it. Returns a discriminated result the route maps to a status.
   */
  async createContactMessage(body: Record<string, unknown>): Promise<CreateContactMessageResult> {
    const name = body.name as string | undefined;
    const email = body.email as string | undefined;
    const message = body.message as string | undefined;
    const subject = body.subject as string | undefined;

    // Validate required fields
    if (!name || !email || !message) {
      return { status: 'invalid', message: 'Name, email, and message are required fields' };
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedMessage = message.trim();
    const trimmedSubject = subject?.trim() || null;

    // Length validation to prevent abuse
    if (trimmedName.length < 2 || trimmedName.length > 100) {
      return { status: 'invalid', message: 'Name must be between 2 and 100 characters' };
    }
    if (trimmedMessage.length < 10 || trimmedMessage.length > 5000) {
      return { status: 'invalid', message: 'Message must be between 10 and 5000 characters' };
    }
    if (trimmedSubject && trimmedSubject.length > 200) {
      return { status: 'invalid', message: 'Subject must be less than 200 characters' };
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return { status: 'invalid', message: 'Invalid email format' };
    }

    // Duplicate submission (same email + message) within the last hour
    const duplicate = await this.repository.findRecentDuplicate(trimmedEmail, trimmedMessage);
    if (duplicate) return { status: 'duplicate' };

    // Too many messages from the same email in the last hour (max 5)
    const recentMessagesCount = await this.repository.countRecentByEmail(trimmedEmail);
    if (recentMessagesCount >= 5) return { status: 'throttled' };

    // Basic spam detection — log but do not block
    const combinedText = `${trimmedSubject?.toLowerCase() || ''} ${trimmedMessage.toLowerCase()}`;
    for (const pattern of SPAM_PATTERNS) {
      if (pattern.test(combinedText)) {
        console.log(`⚠️ Potential spam detected from ${trimmedEmail}: ${pattern}`);
      }
    }

    const contactMessage = await this.repository.create({
      name: trimmedName,
      email: trimmedEmail,
      message: trimmedMessage,
      subject: trimmedSubject,
    } as unknown as DeepPartial<ContactMessage>);

    return { status: 'created', contactMessage };
  }

  async findMessageById(id: string): Promise<ContactMessage | null> {
    return this.repository.findById(id);
  }

  async findAllMessages(): Promise<ContactMessage[]> {
    return this.repository.findAll();
  }

  async updateMessage(id: string, data: Partial<ContactMessage>): Promise<ContactMessage | null> {
    const message = await this.findMessageById(id);
    if (!message) {
      return null;
    }
    Object.assign(message, data);
    return await this.repository.save(message);
  }

  async deleteMessage(id: string): Promise<boolean> {
    const message = await this.findMessageById(id);
    if (!message) {
      return false;
    }
    await this.repository.delete(id);
    return true;
  }
}
