import { ContactMessage, MessageType, MessageStatus } from '../models/ContactMessage';
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

  async findByType(type: MessageType): Promise<ContactMessage[]> {
    return this.repository.findBy({
      type
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