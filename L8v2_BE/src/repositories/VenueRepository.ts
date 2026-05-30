import { DeepPartial } from 'typeorm';
import { Venue } from '../models/Venue';
import { BaseRepository } from './BaseRepository';

export class VenueRepository extends BaseRepository<Venue> {
  constructor() {
    super(Venue);
  }

  async findAllWithEvents(): Promise<Venue[]> {
    return this.repository.find({ relations: ['events'] });
  }

  async findByIdWithEvents(id: string): Promise<Venue | null> {
    return this.repository.findOne({ where: { id }, relations: ['events'] });
  }

  async mergeAndSave(id: string, data: DeepPartial<Venue>): Promise<Venue | null> {
    const venue = await this.repository.findOne({ where: { id }, relations: ['events'] });
    if (!venue) return null;
    this.repository.merge(venue, data);
    return this.repository.save(venue);
  }
}
