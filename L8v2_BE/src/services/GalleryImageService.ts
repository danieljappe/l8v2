import { DeepPartial } from 'typeorm';
import { GalleryImage, GalleryCategory } from '../models/GalleryImage';
import { GalleryImageRepository } from '../repositories/GalleryImageRepository';
import { EventRepository } from '../repositories/EventRepository';

export type CreateImageResult =
  | { status: 'invalid_event' }
  | { status: 'created'; image: GalleryImage };

export type UpdateImageResult =
  | { status: 'invalid_event' }
  | { status: 'not_found' }
  | { status: 'updated'; image: GalleryImage };

export class GalleryImageService {
  private galleryImageRepository: GalleryImageRepository;
  private eventRepository: EventRepository;

  constructor() {
    this.galleryImageRepository = new GalleryImageRepository();
    this.eventRepository = new EventRepository();
  }

  async getAllImages(eventId?: string, take?: number): Promise<GalleryImage[]> {
    if (eventId) return this.galleryImageRepository.findByEventOrdered(eventId, take);
    return this.galleryImageRepository.findAll();
  }

  async getImageById(id: string): Promise<GalleryImage | null> {
    return this.galleryImageRepository.findById(id);
  }

  /** eventId is optional; when present it must reference an existing event. */
  private async isValidEventId(eventId?: string): Promise<boolean> {
    if (!eventId) return true;
    const event = await this.eventRepository.findById(eventId);
    return !!event;
  }

  async createImage(eventId: string | undefined, imageData: Record<string, unknown>): Promise<CreateImageResult> {
    if (!(await this.isValidEventId(eventId))) return { status: 'invalid_event' };
    const image = await this.galleryImageRepository.create(
      { ...imageData, eventId: eventId || null } as unknown as DeepPartial<GalleryImage>
    );
    return { status: 'created', image };
  }

  async updateImage(id: string, eventId: string | undefined, updateData: Record<string, unknown>): Promise<UpdateImageResult> {
    if (!(await this.isValidEventId(eventId))) return { status: 'invalid_event' };

    const existing = await this.galleryImageRepository.findById(id);
    if (!existing) return { status: 'not_found' };

    const merged = {
      ...updateData,
      eventId: eventId !== undefined ? eventId : existing.eventId,
    } as unknown as DeepPartial<GalleryImage>;

    const image = await this.galleryImageRepository.mergeAndSave(id, merged);
    return { status: 'updated', image: image! };
  }

  async deleteImage(id: string): Promise<boolean> {
    const existing = await this.galleryImageRepository.findById(id);
    if (!existing) return false;
    await this.galleryImageRepository.delete(id);
    return true;
  }

  // ── Existing helpers (retained for compatibility) ──────────────────────────

  async findImagesByEvent(eventId: string): Promise<GalleryImage[]> {
    return this.galleryImageRepository.findByEvent(eventId);
  }

  async findImagesByPhotographer(photographer: string): Promise<GalleryImage[]> {
    return this.galleryImageRepository.findByPhotographer(photographer);
  }

  async findImagesByCategory(category: GalleryCategory): Promise<GalleryImage[]> {
    return this.galleryImageRepository.findByCategory(category);
  }

  async findPublishedImages(): Promise<GalleryImage[]> {
    return this.galleryImageRepository.findPublishedImages();
  }

  async publishImage(id: string): Promise<GalleryImage | null> {
    return this.galleryImageRepository.update(id, { isPublished: true });
  }

  async unpublishImage(id: string): Promise<GalleryImage | null> {
    return this.galleryImageRepository.update(id, { isPublished: false });
  }
}
