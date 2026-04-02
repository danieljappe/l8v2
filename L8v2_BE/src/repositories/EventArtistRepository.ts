import { EventArtist } from '../models/EventArtist';
import { BaseRepository } from './BaseRepository';
import { FindOptionsWhere } from 'typeorm';

export class EventArtistRepository extends BaseRepository<EventArtist> {
  constructor() {
    super(EventArtist);
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

  async findByEventAndArtist(eventId: string, artistId: string): Promise<EventArtist | null> {
    return this.repository.findOneBy({
      event: { id: eventId },
      artist: { id: artistId }
    });
  }

  async findArtistsByPerformanceOrder(eventId: string): Promise<EventArtist[]> {
    return this.repository.find({
      where: {
        event: { id: eventId }
      },
      order: {
        performanceOrder: 'ASC'
      }
    });
  }

  async findArtistsByPerformanceTime(eventId: string): Promise<EventArtist[]> {
    return this.repository.find({
      where: {
        event: { id: eventId }
      },
      order: {
        performanceTime: 'ASC'
      }
    });
  }
} 