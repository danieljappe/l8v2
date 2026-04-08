/**
 * Query Benchmark — EXPLAIN ANALYZE before vs after optimization
 *
 * Run BEFORE applying the migration + endpoint refactoring to capture baseline:
 *   npx ts-node src/scripts/benchmark.ts
 *
 * Then apply the migration, refactor the endpoints, and run again to compare.
 *
 * BEFORE queries: exact SQL the home page currently fires (no WHERE clause,
 *   full table dumps). Sequential scans regardless of indexes.
 *
 * AFTER queries: targeted SQL with WHERE clauses that use the new composite
 *   indexes. Should show index scans after migration:run.
 */

import 'dotenv/config';
import { AppDataSource } from '../config/database';

// ─── ANSI ────────────────────────────────────────────────────────────────────
const b  = (s: string) => `\x1b[1m${s}\x1b[0m`;
const c  = (s: string) => `\x1b[36m${s}\x1b[0m`;
const y  = (s: string) => `\x1b[33m${s}\x1b[0m`;
const r  = (s: string) => `\x1b[31m${s}\x1b[0m`;
const g  = (s: string) => `\x1b[32m${s}\x1b[0m`;
const d  = (s: string) => `\x1b[2m${s}\x1b[0m`;

interface PlanResult {
  label: string;
  cost: string;
  actualTime: string;
  seqScans: number;
  indexScans: number;
  rows: number;
}

// ─── Queries ─────────────────────────────────────────────────────────────────

// Placeholder UUID — the plan shape is identical to a real UUID
const PLACEHOLDER_UUID = '00000000-0000-0000-0000-000000000001';

const BEFORE_QUERIES: Array<{ label: string; description: string; sql: string; params?: unknown[] }> = [
  {
    label: 'B1 — GET /api/events (all)',
    description: 'Full events table + 5-way LEFT JOIN. Called on Home, Gallery, About.',
    sql: `
      SELECT
        e.id, e.title, e.date, e.status,
        v.id  AS v_id,  v.name AS v_name,
        ea.id AS ea_id, ea."performanceOrder",
        a.id  AS a_id,  a.name AS a_name,
        gi.id AS gi_id, gi.url,
        bed.id AS bed_id, bed."billettoEventId"
      FROM event e
      LEFT JOIN venue v                 ON v.id          = e."venueId"
      LEFT JOIN event_artist ea         ON ea."eventId"  = e.id
      LEFT JOIN artist a                ON a.id          = ea."artistId"
      LEFT JOIN gallery_image gi        ON gi."eventId"  = e.id
      LEFT JOIN billetto_event_data bed ON bed."eventId" = e.id
    `
  },
  {
    label: 'B2 — GET /api/artists (all)',
    description: 'Full artists table + bookingUser JOIN. Called on Home, Artists, Booking.',
    sql: `
      SELECT a.id, a.name, a.genre, a."isBookable", a."bookingUserId",
             u.id AS u_id, u."firstName", u."lastName"
      FROM artist a
      LEFT JOIN "user" u ON u.id = a."bookingUserId"
    `
  },
  {
    label: 'B3 — GET /api/gallery (all)',
    description: 'Full gallery_image scan. Called on Gallery page + PreviousEventGallery.',
    sql: `
      SELECT id, url, caption, category, "isPublished", "eventId", "createdAt"
      FROM gallery_image
    `
  }
];

const AFTER_QUERIES: Array<{ label: string; description: string; sql: string; params?: unknown[] }> = [
  {
    label: 'A1 — Upcoming event (hero widget)',
    description: 'WHERE date >= NOW() ORDER BY date ASC LIMIT 1 + relations. Uses IDX_event_date.',
    sql: `
      SELECT
        e.id, e.title, e.date, e.status,
        v.id AS v_id, v.name AS v_name,
        ea.id AS ea_id, ea."performanceOrder",
        a.id AS a_id, a.name AS a_name,
        gi.id AS gi_id, gi.url,
        bed.id AS bed_id, bed."billettoEventId"
      FROM event e
      LEFT JOIN venue v                 ON v.id          = e."venueId"
      LEFT JOIN event_artist ea         ON ea."eventId"  = e.id
      LEFT JOIN artist a                ON a.id          = ea."artistId"
      LEFT JOIN gallery_image gi        ON gi."eventId"  = e.id
      LEFT JOIN billetto_event_data bed ON bed."eventId" = e.id
      WHERE e.date >= NOW()
      ORDER BY e.date ASC
      LIMIT 1
    `
  },
  {
    label: 'A2 — Most recent past event (gallery section)',
    description: 'WHERE date < NOW() ORDER BY date DESC LIMIT 1. Uses IDX_event_date.',
    sql: `
      SELECT
        e.id, e.title, e.date, e.status,
        v.id AS v_id, v.name AS v_name,
        ea.id AS ea_id, ea."performanceOrder",
        a.id AS a_id, a.name AS a_name
      FROM event e
      LEFT JOIN venue v         ON v.id         = e."venueId"
      LEFT JOIN event_artist ea ON ea."eventId" = e.id
      LEFT JOIN artist a        ON a.id         = ea."artistId"
      WHERE e.date < NOW()
      ORDER BY e.date DESC
      LIMIT 1
    `
  },
  {
    label: 'A3 — Gallery images for specific event',
    description: 'WHERE "eventId" = ? ORDER BY "createdAt" ASC LIMIT 4. Uses IDX_gallery_image_eventId_createdAt.',
    sql: `
      SELECT id, url, caption, "eventId", "isPublished", "createdAt"
      FROM gallery_image
      WHERE "eventId" = $1
      ORDER BY "createdAt" ASC
      LIMIT 4
    `,
    params: [PLACEHOLDER_UUID]
  },
  {
    label: 'A4 — Bookable artists',
    description: 'WHERE "isBookable" = true + bookingUser JOIN. Uses IDX_artist_isBookable.',
    sql: `
      SELECT a.id, a.name, a.genre, a."isBookable", a."bookingUserId",
             u.id AS u_id, u."firstName", u."lastName"
      FROM artist a
      LEFT JOIN "user" u ON u.id = a."bookingUserId"
      WHERE a."isBookable" = true
    `
  }
];

// ─── Plan parser ─────────────────────────────────────────────────────────────

function parsePlan(planLines: string[]): Omit<PlanResult, 'label'> {
  const plan = planLines.join('\n');

  const costMatch = plan.match(/cost=([\d.]+)\.\.([\d.]+)/);
  const timeMatch = plan.match(/actual time=([\d.]+)\.\.([\d.]+)/);
  const rowsMatch = plan.match(/rows=(\d+) /);

  return {
    cost:        costMatch ? `${costMatch[1]}..${costMatch[2]}` : 'n/a',
    actualTime:  timeMatch ? `${timeMatch[1]}..${timeMatch[2]} ms` : 'n/a',
    seqScans:    (plan.match(/Seq Scan/g) ?? []).length,
    indexScans:  (plan.match(/Index Scan|Index Only Scan|Bitmap Index Scan/g) ?? []).length,
    rows:        rowsMatch ? parseInt(rowsMatch[1], 10) : 0
  };
}

async function runQuery(
  sql: string,
  params: unknown[] = [],
  label: string
): Promise<PlanResult> {
  const rows: Array<{ 'QUERY PLAN': string }> = await AppDataSource.query(
    `EXPLAIN (ANALYZE, BUFFERS, FORMAT TEXT) ${sql}`,
    params
  );
  const lines = rows.map(r => r['QUERY PLAN']);
  return { label, ...parsePlan(lines) };
}

function printResult(res: PlanResult): void {
  const seqIcon = res.seqScans  > 0 ? r(` ⚠ Seq scans: ${res.seqScans}`)    : g(' ✓ No seq scans');
  const idxInfo = res.indexScans > 0 ? g(` ✓ Index scans: ${res.indexScans}`) : '';
  console.log(`  ${b(res.label)}`);
  console.log(`    Cost: ${res.cost}  |  Time: ${res.actualTime}  |  Est. rows: ${res.rows}`);
  console.log(`   ${seqIcon}${idxInfo}`);
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main(): Promise<void> {
  console.log(b('\nL8Events — Query Benchmark (EXPLAIN ANALYZE)'));
  console.log(d('Run before migration for baseline, then again after to compare.\n'));

  await AppDataSource.initialize();
  console.log(g('✓ Connected\n'));

  // ── BEFORE ────────────────────────────────────────────────────────────────
  console.log(b('═'.repeat(70)));
  console.log(b('  BEFORE — Current implementation (full table dumps, no WHERE)'));
  console.log(b('═'.repeat(70)));

  const beforeResults: PlanResult[] = [];
  for (const q of BEFORE_QUERIES) {
    console.log(`\n  ${c(q.label)}`);
    console.log(`  ${d(q.description)}`);
    try {
      const result = await runQuery(q.sql, q.params, q.label);
      beforeResults.push(result);
      printResult(result);
    } catch (err: any) {
      console.log(r(`  ✗ Failed: ${err.message}`));
      beforeResults.push({ label: q.label, cost: 'ERR', actualTime: 'ERR', seqScans: 0, indexScans: 0, rows: 0 });
    }
  }

  // ── AFTER ─────────────────────────────────────────────────────────────────
  console.log('\n' + b('═'.repeat(70)));
  console.log(b('  AFTER — Optimized queries (targeted WHERE + composite indexes)'));
  console.log(b('═'.repeat(70)));

  const afterResults: PlanResult[] = [];
  for (const q of AFTER_QUERIES) {
    console.log(`\n  ${c(q.label)}`);
    console.log(`  ${d(q.description)}`);
    try {
      const result = await runQuery(q.sql, q.params, q.label);
      afterResults.push(result);
      printResult(result);
    } catch (err: any) {
      console.log(r(`  ✗ Failed: ${err.message}`));
      afterResults.push({ label: q.label, cost: 'ERR', actualTime: 'ERR', seqScans: 0, indexScans: 0, rows: 0 });
    }
  }

  // ── SUMMARY ───────────────────────────────────────────────────────────────
  console.log('\n' + b('═'.repeat(70)));
  console.log(b('  SUMMARY'));
  console.log(b('═'.repeat(70)));

  const beforeSeqScans  = beforeResults.reduce((n, r) => n + r.seqScans, 0);
  const afterSeqScans   = afterResults.reduce((n, r) => n + r.seqScans, 0);
  const afterIndexScans = afterResults.reduce((n, r) => n + r.indexScans, 0);

  const parseCost = (s: string) => parseFloat(s.split('..')[1] ?? '0') || 0;
  const beforeTotalCost = beforeResults.reduce((n, r) => n + parseCost(r.cost), 0);
  const afterTotalCost  = afterResults.reduce((n, r)  => n + parseCost(r.cost),  0);
  const costReduction   = beforeTotalCost > 0
    ? ((beforeTotalCost - afterTotalCost) / beforeTotalCost * 100).toFixed(1)
    : 'n/a';

  console.log(`\n  Before — Total seq scans : ${r(String(beforeSeqScans))}`);
  console.log(`  After  — Total seq scans : ${afterSeqScans === 0 ? g('0') : y(String(afterSeqScans))}`);
  console.log(`  After  — Index scans     : ${g(String(afterIndexScans))}`);
  console.log(`\n  Before — Cumulative cost : ${beforeTotalCost.toFixed(2)}`);
  console.log(`  After  — Cumulative cost : ${afterTotalCost.toFixed(2)}`);
  console.log(`  Cost reduction           : ${g(costReduction + '%')}\n`);

  await AppDataSource.destroy();
}

main().catch(err => {
  console.error(r('\nFatal:'), err.message);
  process.exit(1);
});
