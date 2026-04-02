import { Artist } from '../models/Artist';
import { ArtistRepository } from '../repositories/ArtistRepository';

export class ArtistService {
  private artistRepository: ArtistRepository;

  constructor() {
    this.artistRepository = new ArtistRepository();
  }

  async getAllArtists(): Promise<Artist[]> {
    return this.artistRepository.findAll();
  }

  async getArtistById(id: string): Promise<Artist | null> {
    return this.artistRepository.findById(id);
  }

  async createArtist(artistData: Partial<Artist>): Promise<Artist> {
    return this.artistRepository.create(artistData);
  }

  async updateArtist(id: string, artistData: Partial<Artist>): Promise<Artist | null> {
    return this.artistRepository.update(id, artistData);
  }

  async deleteArtist(id: string): Promise<void> {
    return this.artistRepository.delete(id);
  }

  async findArtistsByName(name: string): Promise<Artist[]> {
    const artist = await this.artistRepository.findByName(name);
    return artist ? [artist] : [];
  }

  async findArtistsByGenre(genre: string): Promise<Artist[]> {
    return this.artistRepository.findByGenre(genre);
  }

  // Note: isActive and rating properties have been removed from the Artist model
  // These methods are no longer applicable and have been removed
} 