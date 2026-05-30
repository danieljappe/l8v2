import { Artist } from '../models/Artist';
import { BaseRepository } from './BaseRepository';
import { DeepPartial, FindOptionsWhere } from 'typeorm';

const ARTIST_RELATIONS = ['bookingUser'];

export class ArtistRepository extends BaseRepository<Artist> {
  constructor() {
    super(Artist);
  }

  /** All artists (optionally only bookable), with the bookingUser relation loaded. */
  async findAllWithBookingUser(bookable: boolean): Promise<Artist[]> {
    return bookable
      ? this.repository.find({ where: { isBookable: true }, relations: ARTIST_RELATIONS })
      : this.repository.find({ relations: ARTIST_RELATIONS });
  }

  async findByIdWithBookingUser(id: string): Promise<Artist | null> {
    return this.repository.findOne({ where: { id }, relations: ARTIST_RELATIONS });
  }

  /**
   * Loads, applies the patch (handling bookingUserId separately so it can be
   * nulled), saves, and refetches with the bookingUser relation. Null when absent.
   */
  async updateAndReload(id: string, body: Record<string, unknown>): Promise<Artist | null> {
    const artist = await this.repository.findOne({ where: { id } });
    if (!artist) return null;

    const { bookingUserId, ...updateData } = body;
    if (bookingUserId !== undefined) {
      (artist as { bookingUserId?: string | null }).bookingUserId = (bookingUserId as string) || null;
    }

    this.repository.merge(artist, updateData as DeepPartial<Artist>);
    await this.repository.save(artist);

    return this.repository.findOne({ where: { id }, relations: ARTIST_RELATIONS });
  }

  async findByName(name: string): Promise<Artist | null> {
    return this.repository.findOneBy({ name } as FindOptionsWhere<Artist>);
  }

  async findByGenre(genre: string): Promise<Artist[]> {
    return this.repository.findBy({ genre } as FindOptionsWhere<Artist>);
  }
}
