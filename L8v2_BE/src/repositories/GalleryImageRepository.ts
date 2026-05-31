import { GalleryImage } from '../models/GalleryImage';
import { BaseRepository } from './BaseRepository';
import { EntityManager, DeepPartial } from 'typeorm';

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

  /** Images for an event ordered by createdAt ASC (used by ?eventId=&limit=). */
  async findByEventOrdered(eventId: string, take?: number): Promise<GalleryImage[]> {
    return this.repository.find({
      where: { eventId },
      order: { createdAt: 'ASC' },
      take
    });
  }

  async mergeAndSave(id: string, data: DeepPartial<GalleryImage>): Promise<GalleryImage | null> {
    const image = await this.repository.findOne({ where: { id } });
    if (!image) return null;
    this.repository.merge(image, data);
    return this.repository.save(image);
  }
}
