import { Event } from '../models/Event';
import { EventRepository } from '../repositories/EventRepository';

export class EventService {
  private eventRepository: EventRepository;

  constructor() {
    this.eventRepository = new EventRepository();
  }

  async getAllEvents(): Promise<Event[]> {
    return this.eventRepository.findAll();
  }

  async getEventById(id: string): Promise<Event | null> {
    return this.eventRepository.findById(id);
  }

  async createEvent(eventData: Partial<Event>): Promise<Event> {
    return this.eventRepository.create(eventData);
  }

  async updateEvent(id: string, eventData: Partial<Event>): Promise<Event | null> {
    return this.eventRepository.update(id, eventData);
  }

  async deleteEvent(id: string): Promise<void> {
    return this.eventRepository.delete(id);
  }

  async findEventsByVenue(venueId: string): Promise<Event[]> {
    return this.eventRepository.findByVenue(venueId);
  }

  async findEventsByArtist(artistId: string): Promise<Event[]> {
    return this.eventRepository.findByArtist(artistId);
  }

  async findEventsByDateRange(startDate: Date, endDate: Date): Promise<Event[]> {
    return this.eventRepository.findByDateRange(startDate, endDate);
  }

  async findUpcomingEvents(): Promise<Event[]> {
    return this.eventRepository.findUpcomingEvents();
  }

  async findPastEvents(): Promise<Event[]> {
    return this.eventRepository.findPastEvents();
  }

  async updateEventStatus(id: string, status: string): Promise<Event | null> {
    return this.eventRepository.update(id, { status });
  }

  async updateEventCapacity(id: string, capacity: number): Promise<Event | null> {
    return this.eventRepository.update(id, { capacity });
  }

  async updateEventAttendees(id: string, currentAttendees: number): Promise<Event | null> {
    const event = await this.eventRepository.findById(id);
    if (!event) return null;

    if (event.capacity && currentAttendees > event.capacity) {
      throw new Error('Cannot exceed event capacity');
    }

    return this.eventRepository.update(id, { currentAttendees });
  }
} 