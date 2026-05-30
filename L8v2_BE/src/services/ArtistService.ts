import { DeepPartial } from 'typeorm';
import { Artist, Embedding } from '../models/Artist';
import { ArtistRepository } from '../repositories/ArtistRepository';
import { EventArtistRepository } from '../repositories/EventArtistRepository';
import {
  validateAndSanitizeEmbedding,
  sanitizeEmbedCode,
  createEmbedding,
} from '../utils/embeddingUtils';

export type CreateArtistResult =
  | { status: 'created'; artist: Artist }
  | { status: 'save_failed' }
  | { status: 'reload_failed' };

export type DeleteArtistResult =
  | { status: 'not_found' }
  | { status: 'linked'; relatedEvents: number; eventNames: string; eventIds: string[] }
  | { status: 'deleted' };

export type AddEmbeddingResult =
  | { status: 'not_found' }
  | { status: 'invalid'; error?: string }
  | { status: 'create_failed' }
  | { status: 'created'; embedding: Embedding };

export type UpdateEmbeddingResult =
  | { status: 'not_found' }
  | { status: 'no_embeddings' }
  | { status: 'embedding_not_found' }
  | { status: 'invalid'; error?: string }
  | { status: 'updated'; embedding: Embedding };

export type DeleteEmbeddingResult =
  | { status: 'not_found' }
  | { status: 'no_embeddings' }
  | { status: 'embedding_not_found' }
  | { status: 'deleted' };

export class ArtistService {
  private artistRepository: ArtistRepository;
  private eventArtistRepository: EventArtistRepository;

  constructor() {
    this.artistRepository = new ArtistRepository();
    this.eventArtistRepository = new EventArtistRepository();
  }

  async getAllArtists(bookable = false): Promise<Artist[]> {
    return this.artistRepository.findAllWithBookingUser(bookable);
  }

  async getArtistById(id: string): Promise<Artist | null> {
    return this.artistRepository.findByIdWithBookingUser(id);
  }

  async createArtist(artistData: DeepPartial<Artist>): Promise<CreateArtistResult> {
    // Validate and sanitize any embeddings supplied on creation.
    const data = artistData as { embeddings?: Array<Record<string, unknown>> };
    if (data.embeddings && Array.isArray(data.embeddings)) {
      for (const embedding of data.embeddings) {
        const validation = validateAndSanitizeEmbedding(embedding.embedCode as string);
        if (validation.isValid) {
          embedding.embedCode = sanitizeEmbedCode(validation.sanitizedCode!);
          embedding.platform = validation.platform!;
          embedding.title = validation.title;
          embedding.description = validation.description;
          embedding.thumbnailUrl = validation.thumbnailUrl;
        } else {
          console.warn('Invalid embedding code:', validation.error);
        }
      }
    }

    const saved = await this.artistRepository.create(artistData);
    if (!saved || !saved.id) return { status: 'save_failed' };

    const reloaded = await this.artistRepository.findByIdWithBookingUser(saved.id);
    if (!reloaded) return { status: 'reload_failed' };

    return { status: 'created', artist: reloaded };
  }

  async updateArtist(id: string, body: Record<string, unknown>): Promise<Artist | null> {
    return this.artistRepository.updateAndReload(id, body);
  }

  /** Refuses to delete an artist still linked to events; otherwise removes it. */
  async deleteArtist(id: string): Promise<DeleteArtistResult> {
    const artist = await this.artistRepository.findById(id);
    if (!artist) return { status: 'not_found' };

    const related = await this.eventArtistRepository.findByArtistWithEvent(id);
    if (related.length > 0) {
      const eventNames = related.map(ea => ea.event?.title || 'Unknown Event').join(', ');
      const eventIds = related.map(ea => ea.event?.id).filter((eid): eid is string => Boolean(eid));
      return { status: 'linked', relatedEvents: related.length, eventNames, eventIds };
    }

    await this.artistRepository.delete(id);
    return { status: 'deleted' };
  }

  // ── Embeddings (stored as a JSON array on the artist) ──────────────────────

  async addEmbedding(id: string, embedCode: string): Promise<AddEmbeddingResult> {
    const artist = await this.artistRepository.findById(id);
    if (!artist) return { status: 'not_found' };

    const validation = validateAndSanitizeEmbedding(embedCode);
    if (!validation.isValid) return { status: 'invalid', error: validation.error };

    const sanitizedCode = sanitizeEmbedCode(validation.sanitizedCode!);
    const newEmbedding = createEmbedding(sanitizedCode);
    if (!newEmbedding) return { status: 'create_failed' };

    if (!artist.embeddings) artist.embeddings = [];
    artist.embeddings.push(newEmbedding);
    await this.artistRepository.save(artist);

    return { status: 'created', embedding: newEmbedding };
  }

  async updateEmbedding(id: string, embeddingId: string, embedCode: string): Promise<UpdateEmbeddingResult> {
    const artist = await this.artistRepository.findById(id);
    if (!artist) return { status: 'not_found' };
    if (!artist.embeddings) return { status: 'no_embeddings' };

    const idx = artist.embeddings.findIndex(emb => emb.id === embeddingId);
    if (idx === -1) return { status: 'embedding_not_found' };

    const validation = validateAndSanitizeEmbedding(embedCode);
    if (!validation.isValid) return { status: 'invalid', error: validation.error };

    const sanitizedCode = sanitizeEmbedCode(validation.sanitizedCode!);
    artist.embeddings[idx] = {
      ...artist.embeddings[idx],
      embedCode: sanitizedCode,
      platform: validation.platform!,
      title: validation.title,
      description: validation.description,
      thumbnailUrl: validation.thumbnailUrl,
    };
    await this.artistRepository.save(artist);

    return { status: 'updated', embedding: artist.embeddings[idx] };
  }

  async deleteEmbedding(id: string, embeddingId: string): Promise<DeleteEmbeddingResult> {
    const artist = await this.artistRepository.findById(id);
    if (!artist) return { status: 'not_found' };
    if (!artist.embeddings) return { status: 'no_embeddings' };

    const idx = artist.embeddings.findIndex(emb => emb.id === embeddingId);
    if (idx === -1) return { status: 'embedding_not_found' };

    artist.embeddings.splice(idx, 1);
    await this.artistRepository.save(artist);

    return { status: 'deleted' };
  }
}
