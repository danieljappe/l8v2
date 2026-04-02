import { GalleryImage, GalleryCategory } from '../models/GalleryImage';
import { BaseRepository } from './BaseRepository';
import { FindOptionsWhere, Between, In } from 'typeorm';

export class GalleryImageRepository extends BaseRepository<GalleryImage> {
  constructor() {
    super(GalleryImage);
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

  async findByTags(tags: string[]): Promise<GalleryImage[]> {
    return this.repository.find({
      where: {
        tags: In(tags),
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