import { GalleryImage, GalleryCategory } from '../models/GalleryImage';
import { GalleryImageRepository } from '../repositories/GalleryImageRepository';

export class GalleryImageService {
  private galleryImageRepository: GalleryImageRepository;

  constructor() {
    this.galleryImageRepository = new GalleryImageRepository();
  }

  async getAllImages(): Promise<GalleryImage[]> {
    return this.galleryImageRepository.findAll();
  }

  async getImageById(id: string): Promise<GalleryImage | null> {
    return this.galleryImageRepository.findById(id);
  }

  async createImage(imageData: Partial<GalleryImage>): Promise<GalleryImage> {
    return this.galleryImageRepository.create(imageData);
  }

  async updateImage(id: string, imageData: Partial<GalleryImage>): Promise<GalleryImage | null> {
    return this.galleryImageRepository.update(id, imageData);
  }

  async deleteImage(id: string): Promise<void> {
    return this.galleryImageRepository.delete(id);
  }

  async findImagesByEvent(eventId: string): Promise<GalleryImage[]> {
    return this.galleryImageRepository.findByEvent(eventId);
  }

  async findImagesByPhotographer(photographer: string): Promise<GalleryImage[]> {
    return this.galleryImageRepository.findByPhotographer(photographer);
  }

  async findImagesByCaption(caption: string): Promise<GalleryImage[]> {
    return this.galleryImageRepository.findByCaption(caption);
  }

  async findImagesByCategory(category: GalleryCategory): Promise<GalleryImage[]> {
    return this.galleryImageRepository.findByCategory(category);
  }

  async findPublishedImages(): Promise<GalleryImage[]> {
    return this.galleryImageRepository.findPublishedImages();
  }

  async findImagesByDateRange(startDate: Date, endDate: Date): Promise<GalleryImage[]> {
    return this.galleryImageRepository.findImagesByDateRange(startDate, endDate);
  }

  async publishImage(id: string): Promise<GalleryImage | null> {
    return this.galleryImageRepository.update(id, { isPublished: true });
  }

  async unpublishImage(id: string): Promise<GalleryImage | null> {
    return this.galleryImageRepository.update(id, { isPublished: false });
  }

} 