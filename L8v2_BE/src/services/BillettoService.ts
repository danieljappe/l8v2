import { AppDataSource } from '../config/database';
import { Event } from '../models/Event';
import { BillettoEventData } from '../models/BillettoEventData';
import { BillettoEventDataRepository } from '../repositories/BillettoEventDataRepository';
import { BillettoApiClient, BillettoApiEvent } from './BillettoApiClient';

export interface SyncSummary {
  total: number;
  linked: number;
  unlinked: number;
  errors: string[];
}

export class BillettoService {
  private readonly repo: BillettoEventDataRepository;
  private readonly apiClient: BillettoApiClient;
  private readonly eventRepo = AppDataSource.getRepository(Event);

  constructor() {
    this.repo = new BillettoEventDataRepository();
    this.apiClient = new BillettoApiClient();
  }

  // Tries to find a local Event whose title appears as a substring of the Billetto event name (case-insensitive).
  // e.g. local "CHROME! & SKOMAGER" matches Billetto "Chrome! & Skomager (forårstour 2026...) - Hosted af L8"
  private async matchLocalEvent(billettoEvent: BillettoApiEvent): Promise<Event | null> {
    const name = billettoEvent.name;
    if (!name) return null;

    const allEvents = await this.eventRepo.find({ select: ['id', 'title'] });
    const lowerName = name.toLowerCase();

    const match = allEvents.find(e => lowerName.includes(e.title.toLowerCase()));
    return match ?? null;
  }

  private async upsertOne(billettoEvent: BillettoApiEvent, localEvent: Event | null): Promise<void> {
    const billettoEventId = String(billettoEvent.id);
    const publicUrl = BillettoApiClient.extractPublicUrl(billettoEvent);
    const maxCapacity = BillettoApiClient.extractCapacity(billettoEvent);
    const ticketsAvailable = BillettoApiClient.extractTicketsAvailable(billettoEvent);

    let record = await this.repo.findByBillettoEventId(billettoEventId);

    if (record) {
      record.publicUrl = publicUrl || record.publicUrl;
      record.maxCapacity = maxCapacity;
      record.ticketsAvailable = ticketsAvailable;
      record.lastSyncedAt = new Date();
      if (localEvent && !record.eventId) {
        record.eventId = localEvent.id;
      }
      await this.repo.save(record);
    } else {
      const newRecord = new BillettoEventData();
      newRecord.billettoEventId = billettoEventId;
      newRecord.publicUrl = publicUrl;
      newRecord.maxCapacity = maxCapacity;
      newRecord.ticketsAvailable = ticketsAvailable;
      newRecord.lastSyncedAt = new Date();
      newRecord.eventId = localEvent?.id ?? null;
      await this.repo.save(newRecord);
    }

    // Keep event.maxCapacity in sync so it's available without joining billetto_event_data
    const linkedEventId = localEvent?.id ?? record?.eventId;
    if (linkedEventId && maxCapacity != null) {
      await this.eventRepo.update(linkedEventId, { maxCapacity });
    }
  }

  async syncAllEvents(): Promise<SyncSummary> {
    const summary: SyncSummary = { total: 0, linked: 0, unlinked: 0, errors: [] };

    const billettoEvents = await this.apiClient.getAllEvents();
    summary.total = billettoEvents.length;

    for (const billettoEvent of billettoEvents) {
      try {
        const localEvent = await this.matchLocalEvent(billettoEvent);
        await this.upsertOne(billettoEvent, localEvent);
        if (localEvent) {
          summary.linked++;
        } else {
          summary.unlinked++;
        }
      } catch (err: any) {
        summary.errors.push(`Event ${billettoEvent.id}: ${err.message}`);
      }
    }

    console.log(`[BillettoService] Sync complete:`, summary);
    return summary;
  }

  async syncSingleEvent(billettoEventId: string): Promise<BillettoEventData> {
    const billettoEvent = await this.apiClient.getEvent(billettoEventId);
    const localEvent = await this.matchLocalEvent(billettoEvent);
    await this.upsertOne(billettoEvent, localEvent);

    const record = await this.repo.findByBillettoEventId(billettoEventId);
    if (!record) throw new Error(`Failed to find record after sync for ${billettoEventId}`);
    return record;
  }

  async handleWebhook(payload: Record<string, unknown>): Promise<void> {
    // Billetto webhook payload shape: { type: "event.updated", data: { id: 123, ... } }
    // Log the full payload so you can verify the exact field names Billetto sends.
    console.log('[BillettoService] Webhook received:', JSON.stringify(payload, null, 2));

    const eventType = (payload.type ?? payload.event) as string | undefined;
    const data = (payload.data ?? payload) as Record<string, unknown>;

    if (!eventType) {
      console.warn('[BillettoService] Webhook missing event type, raw payload logged above');
      return;
    }

    switch (eventType) {
      case 'event.created':
      case 'event.updated': {
        const id = data.id ?? data.event_id;
        if (id) {
          await this.syncSingleEvent(String(id));
        }
        break;
      }
      case 'event.cancelled': {
        const id = data.id ?? data.event_id;
        if (id) {
          const record = await this.repo.findByBillettoEventId(String(id));
          if (record) {
            record.ticketsAvailable = 0;
            record.lastSyncedAt = new Date();
            await this.repo.save(record);
          }
        }
        break;
      }
      case 'order.completed':
      case 'order.cancelled': {
        // Re-sync the affected event to get updated ticket counts
        const eventId = data.event_id ?? data.billetto_event_id;
        if (eventId) {
          await this.syncSingleEvent(String(eventId));
        }
        break;
      }
      default:
        console.log(`[BillettoService] Unhandled webhook type: ${eventType}`);
    }
  }

  async getAllRecords(): Promise<BillettoEventData[]> {
    return this.repo.findAllWithEvent();
  }
}
