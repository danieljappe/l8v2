import { Venue } from '../models/Venue';
import { VenueRepository } from '../repositories/VenueRepository';

export class VenueService {
  private venueRepository: VenueRepository;

  constructor() {
    this.venueRepository = new VenueRepository();
  }

  async getAllVenues(): Promise<Venue[]> {
    return this.venueRepository.findAll();
  }

  async getVenueById(id: string): Promise<Venue | null> {
    return this.venueRepository.findById(id);
  }

  async createVenue(venueData: Partial<Venue>): Promise<Venue> {
    return this.venueRepository.create(venueData);
  }

  async updateVenue(id: string, venueData: Partial<Venue>): Promise<Venue | null> {
    return this.venueRepository.update(id, venueData);
  }

  async deleteVenue(id: string): Promise<void> {
    return this.venueRepository.delete(id);
  }

  async findVenuesByName(name: string): Promise<Venue[]> {
    const venue = await this.venueRepository.findByName(name);
    return venue ? [venue] : [];
  }

  async findVenuesByCity(city: string): Promise<Venue[]> {
    return this.venueRepository.findByCity(city);
  }

  async addVenueImage(id: string, imageUrl: string): Promise<Venue | null> {
    const venue = await this.venueRepository.findById(id);
    if (!venue) return null;

    const images = venue.images || [];
    images.push(imageUrl);

    return this.venueRepository.update(id, { images });
  }

  async removeVenueImage(id: string, imageUrl: string): Promise<Venue | null> {
    const venue = await this.venueRepository.findById(id);
    if (!venue) return null;

    const images = venue.images?.filter((img: string) => img !== imageUrl) || [];

    return this.venueRepository.update(id, { images });
  }
}