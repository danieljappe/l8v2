import { Ticket } from '../models/Ticket';
import { BaseRepository } from './BaseRepository';
import { FindOptionsWhere, LessThanOrEqual, MoreThanOrEqual, Between } from 'typeorm';

export class TicketRepository extends BaseRepository<Ticket> {
  constructor() {
    super(Ticket);
  }

  async findByEvent(eventId: string): Promise<Ticket[]> {
    return this.repository.findBy({
      event: { id: eventId }
    } as FindOptionsWhere<Ticket>);
  }

  async findByUser(userId: string): Promise<Ticket[]> {
    return this.repository.findBy({
      user: { id: userId }
    } as FindOptionsWhere<Ticket>);
  }

  async findByTicketNumber(ticketNumber: string): Promise<Ticket | null> {
    return this.repository.findOneBy({
      ticketNumber
    } as FindOptionsWhere<Ticket>);
  }

  async findUnusedTickets(): Promise<Ticket[]> {
    return this.repository.findBy({
      isUsed: false
    } as FindOptionsWhere<Ticket>);
  }

  async findTicketsByPriceRange(minPrice: number, maxPrice: number): Promise<Ticket[]> {
    return this.repository.findBy({
      price: Between(minPrice, maxPrice)
    } as FindOptionsWhere<Ticket>);
  }
} 