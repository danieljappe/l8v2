import { Venue } from '../models/Venue';
import { BaseRepository } from './BaseRepository';
import { FindOptionsWhere } from 'typeorm';

export class VenueRepository extends BaseRepository<Venue> {
  constructor() {
    super(Venue);
  }

  async findByName(name: string): Promise<Venue | null> {
    return this.repository.findOneBy({ name } as FindOptionsWhere<Venue>);
  }

  async findByAddress(address: string): Promise<Venue[]> {
    return this.repository.findBy({ address } as FindOptionsWhere<Venue>);
  }

  async findByCity(city: string): Promise<Venue[]> {
    return this.repository.findBy({ city } as FindOptionsWhere<Venue>);
  }
}