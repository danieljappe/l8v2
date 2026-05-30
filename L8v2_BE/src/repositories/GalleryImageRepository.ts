import { GalleryImage, GalleryCategory } from '../models/GalleryImage';
import { BaseRepository } from './BaseRepository';
import { Between, EntityManager } from 'typeorm';

export class GalleryImageRepository extends BaseRepository<GalleryImage> {
  constructor() {
    super(GalleryImage);
  }

  /**
   * Deletes all gallery images for an event. Accepts an optional EntityManager
   * so it can run inside a caller's transaction (event cascade).
   */
  async deleteByEvent(eventId: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(GalleryImage) : this.repository;
    await repo.delete({ eventId });
  }

  async findByEvent(eventId: string): Promise<GalleryImage[]> {
    return this.repository.find({
      where: {
        eventId
      }
    });
  }

  async findByPhotographer(photographer: string): Promise<GalleryImage[]> {
    return this.repository.find({
      where: {
        photographer
      }
    });
  }

  async findByCaption(caption: string): Promise<GalleryImage[]> {
    return this.repository.find({
      where: {
        caption
      }
    });
  }

  async findByCategory(category: GalleryCategory): Promise<GalleryImage[]> {
    return this.repository.find({
      where: {
        category,
        isPublished: true
      }
    });
  }

  async findPublishedImages(): Promise<GalleryImage[]> {
    return this.repository.find({
      where: {
        isPublished: true
      }
    });
  }

  async findImagesByDateRange(startDate: Date, endDate: Date): Promise<GalleryImage[]> {
    return this.repository.find({
      where: {
        createdAt: Between(startDate, endDate)
      }
    });
  }
} 