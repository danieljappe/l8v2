import { DeepPartial } from 'typeorm';
import { Venue } from '../models/Venue';
import { VenueRepository } from '../repositories/VenueRepository';

export class VenueService {
  private venueRepository: VenueRepository;

  constructor() {
    this.venueRepository = new VenueRepository();
  }

  async getAllVenues(): Promise<Venue[]> {
    return this.venueRepository.findAllWithEvents();
  }

  async getVenueById(id: string): Promise<Venue | null> {
    return this.venueRepository.findByIdWithEvents(id);
  }

  async createVenue(venueData: DeepPartial<Venue>): Promise<Venue> {
    return this.venueRepository.create(venueData);
  }

  async updateVenue(id: string, venueData: DeepPartial<Venue>): Promise<Venue | null> {
    return this.venueRepository.mergeAndSave(id, venueData);
  }

  async deleteVenue(id: string): Promise<boolean> {
    const venue = await this.venueRepository.findById(id);
    if (!venue) return false;
    await this.venueRepository.delete(id);
    return true;
  }
}
