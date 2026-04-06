export interface BillettoTicketType {
  id: string | number;
  name?: string;
  quantity?: number;
  price?: number;
  [key: string]: unknown;
}

export interface BillettoAvailability {
  status?: string;      // e.g. "available", "sold_out", "medium"
  available?: number;   // remaining tickets
  [key: string]: unknown;
}

// Raw event shape returned by the Billetto API v3.
export interface BillettoApiEvent {
  id: string | number;
  name?: string;             // event title
  public_url?: string;
  manage_url?: string;
  starts_at?: string;
  ends_at?: string;
  state?: string;
  total_capacity?: number;   // direct capacity field on the event
  availability?: BillettoAvailability;
  ticket_types?: BillettoTicketType[];
  [key: string]: unknown;
}

interface PaginatedResponse {
  data?: BillettoApiEvent[];
  has_more?: boolean;
  total?: number;
  next_url?: string | null;
}

export class BillettoApiClient {
  private readonly baseUrl: string;
  private readonly authHeader: string;

  constructor() {
    const apiKey = process.env.BILLETTO_API_KEY;
    const apiSecret = process.env.BILLETTO_API_SECRET;
    this.baseUrl = process.env.BILLETTO_API_BASE_URL || 'https://billetto.dk/api/v3';

    if (!apiKey) throw new Error('BILLETTO_API_KEY is not set');
    if (!apiSecret) throw new Error('BILLETTO_API_SECRET is not set');

    // Billetto authentication: Api-Keypair header with "key:secret"
    this.authHeader = `${apiKey}:${apiSecret}`;
  }

  private async request<T>(path: string): Promise<T> {
    const url = `${this.baseUrl}${path}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000); // 15s timeout

    try {
      const res = await fetch(url, {
        signal: controller.signal,
        headers: {
          'Api-Keypair': this.authHeader,
          'Billetto-Version': '2026-02-10',
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Billetto API error ${res.status} for ${path}: ${body}`);
      }

      return res.json() as Promise<T>;
    } finally {
      clearTimeout(timeout);
    }
  }

  async getEvent(billettoEventId: string | number): Promise<BillettoApiEvent> {
    return this.request<BillettoApiEvent>(`/organiser/events/${billettoEventId}`);
  }

  // Fetches all organiser-owned events using cursor-based pagination.
  // expand=ticket_types includes capacity data per event.
  async getAllEvents(): Promise<BillettoApiEvent[]> {
    const events: BillettoApiEvent[] = [];
    let path = '/organiser/events?expand=ticket_types';
    let firstPage = true;

    while (true) {
      const response = await this.request<PaginatedResponse>(path);

      if (firstPage) {
        console.log('[BillettoApiClient] Response keys:', Object.keys(response));
        const sample = response.data?.[0];
        if (sample) {
          console.log('[BillettoApiClient] Sample event:', JSON.stringify(sample, null, 2));
        }
        firstPage = false;
      }

      const pageEvents = response.data ?? [];
      events.push(...pageEvents);

      // Cursor-based: follow next_url if has_more
      if (!response.has_more || !response.next_url) break;

      // next_url is a full URL — strip the base so request() can prepend it
      const nextPath = response.next_url.replace(this.baseUrl, '');
      path = nextPath;
    }

    console.log(`[BillettoApiClient] Fetched ${events.length} events total`);
    return events;
  }

  static extractPublicUrl(event: BillettoApiEvent): string {
    return event.public_url || '';
  }

  // Use total_capacity directly from the event object.
  static extractCapacity(event: BillettoApiEvent): number | undefined {
    return event.total_capacity;
  }

  // Remaining tickets: availability.available
  static extractTicketsAvailable(event: BillettoApiEvent): number | undefined {
    return event.availability?.available;
  }
}
