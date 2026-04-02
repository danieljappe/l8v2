import { ContactMessage, MessageType, MessageStatus } from '../models/ContactMessage';
import { ContactMessageRepository } from '../repositories/ContactMessageRepository';

export class ContactMessageService {
  private repository: ContactMessageRepository;

  constructor() {
    this.repository = new ContactMessageRepository();
  }

  async createMessage(data: Partial<ContactMessage>): Promise<ContactMessage> {
    const message = await this.repository.create(data);
    return await this.repository.save(message);
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

  async findMessagesByEmail(email: string): Promise<ContactMessage[]> {
    return this.repository.findByEmail(email);
  }

  async findUnreadMessages(): Promise<ContactMessage[]> {
    return this.repository.findUnreadMessages();
  }

  async findReadMessages(): Promise<ContactMessage[]> {
    return this.repository.findReadMessages();
  }

  async findByType(type: MessageType): Promise<ContactMessage[]> {
    return this.repository.findByType(type);
  }

  async findByStatus(status: MessageStatus): Promise<ContactMessage[]> {
    return this.repository.findByStatus(status);
  }

  async findPendingMessages(): Promise<ContactMessage[]> {
    return this.repository.findPendingMessages();
  }

  async findRepliedMessages(): Promise<ContactMessage[]> {
    return this.repository.findRepliedMessages();
  }

  async findMessagesByDateRange(startDate: Date, endDate: Date): Promise<ContactMessage[]> {
    return this.repository.findMessagesByDateRange(startDate, endDate);
  }

  async markMessageAsRead(id: string): Promise<ContactMessage | null> {
    const message = await this.findMessageById(id);
    if (!message) {
      return null;
    }
    message.isRead = true;
    message.status = MessageStatus.READ;
    return await this.repository.save(message);
  }

  async markMessageAsReplied(id: string, adminNotes?: string): Promise<ContactMessage | null> {
    const message = await this.findMessageById(id);
    if (!message) {
      return null;
    }
    message.status = MessageStatus.REPLIED;
    message.repliedAt = new Date();
    if (adminNotes) {
      message.adminNotes = adminNotes;
    }
    return await this.repository.save(message);
  }

  async archiveMessage(id: string): Promise<ContactMessage | null> {
    const message = await this.findMessageById(id);
    if (!message) {
      return null;
    }
    message.status = MessageStatus.ARCHIVED;
    return await this.repository.save(message);
  }
} 