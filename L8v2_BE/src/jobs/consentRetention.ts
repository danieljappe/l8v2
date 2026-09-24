import { ConsentService } from '../services/ConsentService';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Enforce the 24-month retention on consent records: once at startup, then
 * daily. The rule itself lives in purge_expired_consent_records() so the same
 * deletion can be run from cron or psql (scripts/purge-consent-records.sql).
 */
export function startConsentRetentionJob(intervalMs: number = DAY_MS): NodeJS.Timeout {
  const service = new ConsentService();
  const run = async () => {
    try {
      const deleted = await service.purgeExpired();
      if (deleted > 0) console.log(`🧹 Consent retention: deleted ${deleted} record(s) older than 24 months`);
    } catch (error) {
      console.error('Consent retention job failed:', (error as Error).message);
    }
  };
  void run();
  const timer = setInterval(() => void run(), intervalMs);
  // Never keep the process alive just for this.
  timer.unref();
  return timer;
}
