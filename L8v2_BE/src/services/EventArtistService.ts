import { EventArtist } from '../models/EventArtist';
import { EventArtistRepository } from '../repositories/EventArtistRepository';

export class EventArtistService {
  private eventArtistRepository: EventArtistRepository;

  constructor() {
    this.eventArtistRepository = new EventArtistRepository();
  }

  async getAllEventArtists(): Promise<EventArtist[]> {
    return this.eventArtistRepository.findAll();
  }

  async getEventArtistById(id: string): Promise<EventArtist | null> {
    return this.eventArtistRepository.findById(id);
  }

  async createEventArtist(eventArtistData: Partial<EventArtist>): Promise<EventArtist> {
    return this.eventArtistRepository.create(eventArtistData);
  }

  async updateEventArtist(id: string, eventArtistData: Partial<EventArtist>): Promise<EventArtist | null> {
    return this.eventArtistRepository.update(id, eventArtistData);
  }

  async deleteEventArtist(id: string): Promise<void> {
    return this.eventArtistRepository.delete(id);
  }

  async findEventArtistsByEvent(eventId: string): Promise<EventArtist[]> {
    return this.eventArtistRepository.findByEvent(eventId);
  }

  async findEventArtistsByArtist(artistId: string): Promise<EventArtist[]> {
    return this.eventArtistRepository.findByArtist(artistId);
  }

  async findEventArtistByEventAndArtist(eventId: string, artistId: string): Promise<EventArtist | null> {
    return this.eventArtistRepository.findByEventAndArtist(eventId, artistId);
  }

  async findArtistsByPerformanceOrder(eventId: string): Promise<EventArtist[]> {
    return this.eventArtistRepository.findArtistsByPerformanceOrder(eventId);
  }

  async findArtistsByPerformanceTime(eventId: string): Promise<EventArtist[]> {
    return this.eventArtistRepository.findArtistsByPerformanceTime(eventId);
  }

  async updatePerformanceOrder(eventId: string, artistId: string, order: number): Promise<EventArtist | null> {
    const eventArtist = await this.eventArtistRepository.findByEventAndArtist(eventId, artistId);
    if (!eventArtist) return null;

    return this.eventArtistRepository.update(eventArtist.id, { performanceOrder: order });
  }

  async updatePerformanceTime(eventId: string, artistId: string, time: string): Promise<EventArtist | null> {
    const eventArtist = await this.eventArtistRepository.findByEventAndArtist(eventId, artistId);
    if (!eventArtist) return null;

    return this.eventArtistRepository.update(eventArtist.id, { performanceTime: time });
  }

  async updateSetDuration(eventId: string, artistId: string, duration: number): Promise<EventArtist | null> {
    const eventArtist = await this.eventArtistRepository.findByEventAndArtist(eventId, artistId);
    if (!eventArtist) return null;

    return this.eventArtistRepository.update(eventArtist.id, { setDuration: duration });
  }

  async updateArtistFee(eventId: string, artistId: string, fee: number): Promise<EventArtist | null> {
    const eventArtist = await this.eventArtistRepository.findByEventAndArtist(eventId, artistId);
    if (!eventArtist) return null;

    return this.eventArtistRepository.update(eventArtist.id, { fee });
  }
} 