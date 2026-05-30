import { DeepPartial } from 'typeorm';
import { EventArtist } from '../models/EventArtist';
import { EventArtistRepository } from '../repositories/EventArtistRepository';

export class EventArtistService {
  private eventArtistRepository: EventArtistRepository;

  constructor() {
    this.eventArtistRepository = new EventArtistRepository();
  }

  async getAllEventArtists(): Promise<EventArtist[]> {
    return this.eventArtistRepository.findAllWithRelations();
  }

  async getEventArtistById(id: string): Promise<EventArtist | null> {
    return this.eventArtistRepository.findByIdWithRelations(id);
  }

  async createEventArtist(eventArtistData: DeepPartial<EventArtist>): Promise<EventArtist> {
    return this.eventArtistRepository.create(eventArtistData);
  }

  async updateEventArtist(id: string, eventArtistData: DeepPartial<EventArtist>): Promise<EventArtist | null> {
    return this.eventArtistRepository.mergeAndSave(id, eventArtistData);
  }

  async deleteEventArtist(id: string): Promise<boolean> {
    const eventArtist = await this.eventArtistRepository.findById(id);
    if (!eventArtist) return false;
    await this.eventArtistRepository.delete(id);
    return true;
  }

  /**
   * Removes the link between an event and an artist (by their IDs). Returns the
   * removed record (with event + artist relations) so the caller can report it,
   * or null when no such link exists.
   */
  async removeArtistFromEvent(eventId: string, artistId: string): Promise<EventArtist | null> {
    const eventArtist = await this.eventArtistRepository.findByEventAndArtistWithRelations(eventId, artistId);
    if (!eventArtist) return null;
    await this.eventArtistRepository.delete(eventArtist.id);
    return eventArtist;
  }
}
