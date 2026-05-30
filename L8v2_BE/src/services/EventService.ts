import { DeepPartial } from 'typeorm';
import { AppDataSource } from '../config/database';
import { Event } from '../models/Event';
import { EventRepository } from '../repositories/EventRepository';
import { TimelineRepository } from '../repositories/TimelineRepository';
import { EventArtistRepository } from '../repositories/EventArtistRepository';
import { GalleryImageRepository } from '../repositories/GalleryImageRepository';
import { BillettoEventDataRepository } from '../repositories/BillettoEventDataRepository';
import { slugify } from '../utils/slugUtils';

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EventWithTimeline = Event & { timeline: unknown[] };

export class EventService {
  private eventRepository: EventRepository;
  private timelineRepository: TimelineRepository;
  private eventArtistRepository: EventArtistRepository;
  private galleryImageRepository: GalleryImageRepository;
  private billettoEventDataRepository: BillettoEventDataRepository;

  constructor() {
    this.eventRepository = new EventRepository();
    this.timelineRepository = new TimelineRepository();
    this.eventArtistRepository = new EventArtistRepository();
    this.galleryImageRepository = new GalleryImageRepository();
    this.billettoEventDataRepository = new BillettoEventDataRepository();
  }

  async getAllEvents(opts: { upcoming?: boolean; past?: boolean; take?: number } = {}): Promise<Event[]> {
    if (opts.upcoming) return this.eventRepository.findUpcomingWithRelations(opts.take);
    if (opts.past) return this.eventRepository.findPastWithRelations(opts.take);
    return this.eventRepository.findAllWithRelations();
  }

  /**
   * Resolves an event by UUID (with a slugified-title fallback) and appends its
   * running order under `timeline`. Returns null when no event matches.
   */
  async getEventByIdentifier(identifier: string): Promise<EventWithTimeline | null> {
    let event: Event | null = null;

    if (UUID_REGEX.test(identifier)) {
      event = await this.eventRepository.findByIdWithRelations(identifier);
    }

    if (!event) {
      const allEvents = await this.eventRepository.findAllWithRelations();
      event = allEvents.find(e => slugify(e.title) === identifier) || null;
    }

    if (!event) return null;

    const timeline = await this.timelineRepository.findRunningOrder(event.id);
    return { ...event, timeline };
  }

  async createEvent(eventData: DeepPartial<Event>): Promise<Event> {
    return this.eventRepository.create(eventData);
  }

  async updateEvent(id: string, eventData: DeepPartial<Event>): Promise<Event | null> {
    return this.eventRepository.updateWithRelations(id, eventData);
  }

  /**
   * Deletes an event and all of its child records (timeline items, event-artist
   * links, gallery images, Billetto data) in a single transaction. Returns false
   * when the event does not exist. There is no ON DELETE CASCADE on these FKs, so
   * the children are removed explicitly.
   */
  async deleteEvent(id: string): Promise<boolean> {
    const event = await this.eventRepository.findById(id);
    if (!event) return false;

    await AppDataSource.transaction(async manager => {
      await this.timelineRepository.deleteByEvent(id, manager);
      await this.eventArtistRepository.deleteByEvent(id, manager);
      await this.galleryImageRepository.deleteByEvent(id, manager);
      await this.billettoEventDataRepository.deleteByEvent(id, manager);
      await manager.getRepository(Event).delete(id);
    });

    return true;
  }
}
