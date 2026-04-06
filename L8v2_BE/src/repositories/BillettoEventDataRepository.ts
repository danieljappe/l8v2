import { IsNull } from 'typeorm';
import { BillettoEventData } from '../models/BillettoEventData';
import { BaseRepository } from './BaseRepository';

export class BillettoEventDataRepository extends BaseRepository<BillettoEventData> {
  constructor() {
    super(BillettoEventData);
  }

  async findByBillettoEventId(billettoEventId: string): Promise<BillettoEventData | null> {
    return this.repository.findOneBy({ billettoEventId });
  }

  async findByEventId(eventId: string): Promise<BillettoEventData | null> {
    return this.repository.findOneBy({ eventId });
  }

  async findUnlinked(): Promise<BillettoEventData[]> {
    return this.repository.findBy({ eventId: IsNull() });
  }

  async findAllWithEvent(): Promise<BillettoEventData[]> {
    return this.repository.find({ relations: ['event'] });
  }
}
