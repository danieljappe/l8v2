import { Event } from '../models/Event';
import { BaseRepository } from './BaseRepository';
import { FindOptionsWhere, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';

export class EventRepository extends BaseRepository<Event> {
  constructor() {
    super(Event);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    return this.repository.findBy({
      date: Between(startDate, endDate)
    } as FindOptionsWhere<Event>);
  }

  async findUpcomingEvents(): Promise<Event[]> {
    return this.repository.findBy({
      date: MoreThanOrEqual(new Date())
    } as FindOptionsWhere<Event>);
  }

  async findPastEvents(): Promise<Event[]> {
    return this.repository.findBy({
      date: LessThanOrEqual(new Date())
    } as FindOptionsWhere<Event>);
  }

  async findByVenue(venueId: string): Promise<Event[]> {
    return this.repository.findBy({
      venue: { id: venueId }
    } as FindOptionsWhere<Event>);
  }

  async findByArtist(artistId: string): Promise<Event[]> {
    return this.repository.findBy({
      artists: { id: artistId }
    } as FindOptionsWhere<Event>);
  }
} 