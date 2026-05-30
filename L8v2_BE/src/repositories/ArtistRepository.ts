import { Artist } from '../models/Artist';
import { BaseRepository } from './BaseRepository';
import { DeepPartial, FindOptionsWhere } from 'typeorm';

export class ArtistRepository extends BaseRepository<Artist> {
  constructor() {
    super(Artist);
  }

  /** Bookable artists, ordered by name (used by ?bookable=true). */
  async findBookable(): Promise<Artist[]> {
    return this.repository.find({ where: { isBookable: true }, order: { name: 'ASC' } });
  }

  async findByGenre(genre: string): Promise<Artist[]> {
    return this.repository.findBy({ genre } as FindOptionsWhere<Artist>);
  }

  /** Loads, merges the patch, and saves — returns null when the artist is absent. */
  async mergeAndSave(id: string, data: DeepPartial<Artist>): Promise<Artist | null> {
    const artist = await this.repository.findOne({ where: { id } });
    if (!artist) return null;
    this.repository.merge(artist, data);
    return this.repository.save(artist);
  }
}
