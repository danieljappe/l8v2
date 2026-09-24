import { AppDataSource } from '../config/database';
import { ConsentRecord } from '../models/ConsentRecord';

export type RecordConsentResult =
  | { status: 'invalid'; message: string }
  | { status: 'created'; record: ConsentRecord };

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const ALLOWED_KEYS = new Set(['consentId', 'version', 'statistics', 'externalMedia']);

export class ConsentService {
  private get repository() {
    return AppDataSource.getRepository(ConsentRecord);
  }

  /**
   * Persist one consent decision. Only the four expected fields are accepted;
   * anything else is rejected rather than ignored, so the endpoint cannot be
   * used to stash arbitrary (possibly personal) data.
   */
  async record(body: unknown): Promise<RecordConsentResult> {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return { status: 'invalid', message: 'Body must be a JSON object' };
    }
    const input = body as Record<string, unknown>;
    const unknownKeys = Object.keys(input).filter((k) => !ALLOWED_KEYS.has(k));
    if (unknownKeys.length > 0) {
      return { status: 'invalid', message: `Unexpected field(s): ${unknownKeys.join(', ')}` };
    }
    const { consentId, version, statistics, externalMedia } = input;
    if (typeof consentId !== 'string' || !UUID_RE.test(consentId)) {
      return { status: 'invalid', message: 'consentId must be a UUID' };
    }
    if (typeof version !== 'number' || !Number.isInteger(version) || version < 1 || version > 10_000) {
      return { status: 'invalid', message: 'version must be a positive integer' };
    }
    if (typeof statistics !== 'boolean' || typeof externalMedia !== 'boolean') {
      return { status: 'invalid', message: 'statistics and externalMedia must be booleans' };
    }

    const record = await this.repository.save(
      this.repository.create({
        consentId: consentId.toLowerCase(),
        consentVersion: version,
        statistics,
        externalMedia,
      }),
    );
    return { status: 'created', record };
  }

  /** Delete records past the 24-month retention. Returns the number removed. */
  async purgeExpired(): Promise<number> {
    const rows: { deleted: number }[] = await AppDataSource.query(
      'SELECT purge_expired_consent_records() AS deleted',
    );
    return Number(rows[0]?.deleted ?? 0);
  }
}
