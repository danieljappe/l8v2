import { EntityManager } from 'typeorm';
import { BillettoEventData } from '../models/BillettoEventData';
import { BaseRepository } from './BaseRepository';

export class BillettoEventDataRepository extends BaseRepository<BillettoEventData> {
  constructor() {
    super(BillettoEventData);
  }

  /**
   * Deletes all Billetto data rows for an event. Accepts an optional
   * EntityManager so it can run inside a caller's transaction (event cascade).
   */
  async deleteByEvent(eventId: string, manager?: EntityManager): Promise<void> {
    const repo = manager ? manager.getRepository(BillettoEventData) : this.repository;
    await repo.delete({ event: { id: eventId } });
  }

  async findByBillettoEventId(billettoEventId: string): Promise<BillettoEventData | null> {
    return this.repository.findOneBy({ billettoEventId });
  }

  async findAllWithEvent(): Promise<BillettoEventData[]> {
    return this.repository.find({ relations: ['event'] });
  }
}
