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
  private readonly eventRepo = AppDataSource.getRepository(Event);
  private _apiClient: BillettoApiClient | null = null;

  // Lazy getter — only instantiated when a sync/webhook call is made.
  // This allows getAllRecords() to work without BILLETTO_API_KEY being set.
  private get apiClient(): BillettoApiClient {
    if (!this._apiClient) this._apiClient = new BillettoApiClient();
    return this._apiClient;
  }

  constructor() {
    this.repo = new BillettoEventDataRepository();
  }

  // Extract the numeric Billetto event ID from a billettoURL.
  // e.g. "https://billetto.dk/e/chrome-skomager-...-1779694" → "1779694"
  private static extractIdFromUrl(url: string): string | null {
    return /(\d+)\/?$/.exec(url)?.[1] ?? null;
  }

  // Primary: match by Billetto event ID extracted from the event's billettoURL (reliable, explicit).
  // Fallback: name-based heuristics for events that don't have billettoURL set yet.
  private async matchLocalEvent(billettoEvent: BillettoApiEvent): Promise<Event | null> {
    const billettoId = String(billettoEvent.id);
    const allEvents = await this.eventRepo.find({ select: ['id', 'title', 'billettoURL'] });

    // Primary: ID from billettoURL — exact, no ambiguity
    const idMatch = allEvents.find(e => {
      const extracted = e.billettoURL ? BillettoService.extractIdFromUrl(e.billettoURL) : null;
      return extracted === billettoId;
    });
    if (idMatch) return idMatch;

    // Fallback: name matching for events without billettoURL set
    const name = billettoEvent.name;
    if (!name) return null;
    const lowerBilletto = name.toLowerCase();

    const nameMatch =
      allEvents.find(e => lowerBilletto.includes(e.title.toLowerCase())) ??
      allEvents.find(e => e.title.toLowerCase().includes(lowerBilletto)) ??
      allEvents.find(e => {
        const firstWord = e.title.toLowerCase().split(/[\s\-&,!x+()]+/).find(w => w.length >= 5);
        return firstWord ? lowerBilletto.includes(firstWord) : false;
      }) ?? null;

    return nameMatch;
  }

  private async upsertOne(billettoEvent: BillettoApiEvent, localEvent: Event | null): Promise<void> {
    const billettoEventId = String(billettoEvent.id);
    const publicUrl = BillettoApiClient.extractPublicUrl(billettoEvent);
    const maxCapacity = BillettoApiClient.extractCapacity(billettoEvent);
    const ticketsAvailable = BillettoApiClient.extractTicketsAvailable(billettoEvent);
    const eventName = billettoEvent.name ?? undefined;

    const record = await this.repo.findByBillettoEventId(billettoEventId);

    if (record) {
      record.publicUrl = publicUrl || record.publicUrl;
      record.eventName = eventName;
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
      newRecord.eventName = eventName;
      newRecord.maxCapacity = maxCapacity;
      newRecord.ticketsAvailable = ticketsAvailable;
      newRecord.lastSyncedAt = new Date();
      newRecord.eventId = localEvent?.id ?? null;
      await this.repo.save(newRecord);
    }

    // Keep event row in sync so dashboard doesn't need to join billetto_event_data.
    // Also backfill billettoURL if missing — so future syncs use ID matching instead of name matching.
    const linkedEventId = localEvent?.id ?? record?.eventId;
    if (linkedEventId) {
      const soldTickets = (maxCapacity != null && ticketsAvailable != null)
        ? maxCapacity - ticketsAvailable
        : undefined;
      const urlMissing = localEvent && !localEvent.billettoURL && publicUrl;
      await this.eventRepo.update(linkedEventId, {
        ...(maxCapacity != null ? { maxCapacity } : {}),
        ...(soldTickets != null ? { soldTickets } : {}),
        ...(urlMissing ? { billettoURL: publicUrl } : {}),
      });
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
      } catch (err) {
        summary.errors.push(`Event ${billettoEvent.id}: ${err instanceof Error ? err.message : 'Unknown error'}`);
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
            if (record.eventId && record.maxCapacity != null) {
              await this.eventRepo.update(record.eventId, { soldTickets: record.maxCapacity });
            }
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
