import { randomUUID } from 'crypto';
import { DeepPartial } from 'typeorm';
import { Artist, ArtistEmbedding } from '../models/Artist';
import { ArtistRepository } from '../repositories/ArtistRepository';
import { EventArtistRepository } from '../repositories/EventArtistRepository';
import { parseEmbedCode } from '../utils/embeddingUtils';

export type DeleteArtistResult =
  | { status: 'not_found' }
  | { status: 'linked'; count: number }
  | { status: 'deleted' };

export type AddEmbeddingResult =
  | { status: 'not_found' }
  | { status: 'invalid' }
  | { status: 'created'; embedding: ArtistEmbedding };

export type UpdateEmbeddingResult =
  | { status: 'artist_not_found' }
  | { status: 'embedding_not_found' }
  | { status: 'invalid' }
  | { status: 'updated'; embedding: ArtistEmbedding };

export type DeleteEmbeddingResult = { status: 'not_found' } | { status: 'deleted' };

export class ArtistService {
  private artistRepository: ArtistRepository;
  private eventArtistRepository: EventArtistRepository;

  constructor() {
    this.artistRepository = new ArtistRepository();
    this.eventArtistRepository = new EventArtistRepository();
  }

  async getAllArtists(bookable = false): Promise<Artist[]> {
    return bookable ? this.artistRepository.findBookable() : this.artistRepository.findAll();
  }

  async getArtistById(id: string): Promise<Artist | null> {
    return this.artistRepository.findById(id);
  }

  async createArtist(artistData: DeepPartial<Artist>): Promise<Artist> {
    return this.artistRepository.create(artistData);
  }

  async updateArtist(id: string, artistData: DeepPartial<Artist>): Promise<Artist | null> {
    return this.artistRepository.mergeAndSave(id, artistData);
  }

  /** Refuses to delete an artist that is still linked to events. */
  async deleteArtist(id: string): Promise<DeleteArtistResult> {
    const artist = await this.artistRepository.findById(id);
    if (!artist) return { status: 'not_found' };

    const linkedEvents = await this.eventArtistRepository.countByArtist(id);
    if (linkedEvents > 0) return { status: 'linked', count: linkedEvents };

    await this.artistRepository.delete(id);
    return { status: 'deleted' };
  }

  // ── Embeddings (stored as a JSONB array on the artist) ─────────────────────

  async addEmbedding(id: string, embedCode: string): Promise<AddEmbeddingResult> {
    const artist = await this.artistRepository.findById(id);
    if (!artist) return { status: 'not_found' };

    const parsed = parseEmbedCode(embedCode);
    if (!parsed) return { status: 'invalid' };

    const embedding: ArtistEmbedding = {
      id: randomUUID(),
      ...parsed,
      createdAt: new Date().toISOString(),
    };

    artist.embeddings = [...(artist.embeddings || []), embedding];
    await this.artistRepository.save(artist);
    return { status: 'created', embedding };
  }

  async updateEmbedding(id: string, embeddingId: string, embedCode: string): Promise<UpdateEmbeddingResult> {
    const artist = await this.artistRepository.findById(id);
    if (!artist) return { status: 'artist_not_found' };

    const embeddings = artist.embeddings || [];
    const idx = embeddings.findIndex(e => e.id === embeddingId);
    if (idx === -1) return { status: 'embedding_not_found' };

    const parsed = parseEmbedCode(embedCode);
    if (!parsed) return { status: 'invalid' };

    embeddings[idx] = { ...embeddings[idx], ...parsed };
    artist.embeddings = embeddings;
    await this.artistRepository.save(artist);
    return { status: 'updated', embedding: embeddings[idx] };
  }

  async deleteEmbedding(id: string, embeddingId: string): Promise<DeleteEmbeddingResult> {
    const artist = await this.artistRepository.findById(id);
    if (!artist) return { status: 'not_found' };

    artist.embeddings = (artist.embeddings || []).filter(e => e.id !== embeddingId);
    await this.artistRepository.save(artist);
    return { status: 'deleted' };
  }
}
