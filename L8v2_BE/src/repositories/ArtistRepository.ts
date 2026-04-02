import { Artist } from '../models/Artist';
import { BaseRepository } from './BaseRepository';
import { FindOptionsWhere } from 'typeorm';

export class ArtistRepository extends BaseRepository<Artist> {
  constructor() {
    super(Artist);
  }

  async findByName(name: string): Promise<Artist | null> {
    return this.repository.findOneBy({ name } as FindOptionsWhere<Artist>);
  }

  async findByGenre(genre: string): Promise<Artist[]> {
    return this.repository.findBy({ genre } as FindOptionsWhere<Artist>);
  }

  // Note: isActive and rating properties have been removed from the Artist model
  // These methods are no longer applicable and have been removed
} 