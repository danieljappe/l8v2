import { EntityManager } from 'typeorm';
import { EventArtist } from '../models/EventArtist';
import { BaseRepository } from './BaseRepository';

export class EventArtistRepository extends BaseRepository<EventArtist> {
  constructor() {
    super(EventArtist);
  }

  /**
   * Deletes all event-artist links for an event. Accepts an optional
   * EntityManager so it can run inside a caller's transaction (event cascade).
   */
  async deleteByEvent(eventId: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(EventArtist) : this.repository;
    await repo.delete({ event: { id: eventId } });
  }

  async findByEvent(eventId: string): Promise<EventArtist[]> {
    return this.repository.findBy({
      event: { id: eventId }
    });
  }

  async findByArtist(artistId: string): Promise<EventArtist[]> {
    return this.repository.findBy({
      artist: { id: artistId }
    });
  }

  /** Event links for an artist, with the event relation loaded (used by the delete FK check). */
  async findByArtistWithEvent(artistId: string): Promise<EventArtist[]> {
    return this.repository.find({
      where: { artist: { id: artistId } },
      relations: ['event']
    });
  }

  async findByEventAndArtist(eventId: string, artistId: string): Promise<EventArtist | null> {
    return this.repository.findOneBy({
      event: { id: eventId },
      artist: { id: artistId }
    });
  }

  async findArtistsByPerformanceOrder(eventId: string): Promise<EventArtist[]> {
    return this.repository.find({
      where: { event: { id: eventId } },
      order: { createdAt: 'ASC' }
    });
  }

  async findArtistsByPerformanceTime(eventId: string): Promise<EventArtist[]> {
    return this.repository.find({
      where: { event: { id: eventId } },
      order: { createdAt: 'ASC' }
    });
  }
} 