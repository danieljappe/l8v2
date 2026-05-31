import { EntityManager, DeepPartial } from 'typeorm';
import { EventArtist } from '../models/EventArtist';
import { BaseRepository } from './BaseRepository';

const EVENT_ARTIST_RELATIONS = ['event', 'artist'];

export class EventArtistRepository extends BaseRepository<EventArtist> {
  constructor() {
    super(EventArtist);
  }

  async findAllWithRelations(): Promise<EventArtist[]> {
    return this.repository.find({ relations: EVENT_ARTIST_RELATIONS });
  }

  async findByIdWithRelations(id: string): Promise<EventArtist | null> {
    return this.repository.findOne({ where: { id }, relations: EVENT_ARTIST_RELATIONS });
  }

  async mergeAndSave(id: string, data: DeepPartial<EventArtist>): Promise<EventArtist | null> {
    const eventArtist = await this.repository.findOne({ where: { id }, relations: EVENT_ARTIST_RELATIONS });
    if (!eventArtist) return null;
    this.repository.merge(eventArtist, data);
    return this.repository.save(eventArtist);
  }

  async findByEventAndArtistWithRelations(eventId: string, artistId: string): Promise<EventArtist | null> {
    return this.repository.findOne({
      where: { event: { id: eventId }, artist: { id: artistId } },
      relations: EVENT_ARTIST_RELATIONS
    });
  }

  /** Finds an event-artist by its own id, constrained to an event, with the artist loaded. */
  async findByIdAndEventWithArtist(id: string, eventId: string): Promise<EventArtist | null> {
    return this.repository.findOne({
      where: { id, event: { id: eventId } },
      relations: ['artist']
    });
  }

  /** Event links for an artist, with the event relation loaded (used by the delete FK check). */
  async findByArtistWithEvent(artistId: string): Promise<EventArtist[]> {
    return this.repository.find({
      where: { artist: { id: artistId } },
      relations: ['artist', 'event']
    });
  }

  /**
   * Deletes all event-artist links for an event. Accepts an optional
   * EntityManager so it can run inside a caller's transaction (event cascade).
   */
  async deleteByEvent(eventId: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(EventArtist) : this.repository;
    await repo.delete({ event: { id: eventId } });
  }
}
