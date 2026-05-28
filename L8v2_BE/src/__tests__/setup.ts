import dotenv from 'dotenv';
import path from 'path';

// Load test env vars synchronously before any test module imports database.ts.
// dotenv.config() in database.ts does NOT override already-set vars, so these
// values win even though database.ts calls dotenv.config() later.
dotenv.config({ path: path.resolve(__dirname, '../../.env.test'), override: true });

beforeAll(async () => {
  // Dynamic import ensures database.ts is first required AFTER the env vars
  // above are set, so AppDataSource is constructed with DB_NAME=l8v2_test.
  const { AppDataSource } = await import('../config/database');
  if (!AppDataSource.isInitialized) {
    await AppDataSource.initialize();
  }
  // Drop the entire public schema (tables + enum types) then recreate it.
  // synchronize(true) only drops tables, leaving enum types behind which
  // causes duplicate key errors on the next run.
  // Also drop and recreate uuid-ossp: CASCADE removes its functions from the
  // schema but leaves the extension registered in pg_extension, so
  // CREATE EXTENSION IF NOT EXISTS would silently skip reinstalling the functions.
  await AppDataSource.query('DROP SCHEMA public CASCADE');
  await AppDataSource.query('CREATE SCHEMA public');
  await AppDataSource.query('GRANT ALL ON SCHEMA public TO PUBLIC');
  await AppDataSource.query('DROP EXTENSION IF EXISTS "uuid-ossp"');
  await AppDataSource.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp"');
  await AppDataSource.synchronize(true);

  // Create DB objects that live in migrations (views, triggers, functions).
  // synchronize(true) only creates tables from entities; these must be added manually.
  await AppDataSource.query(`
    CREATE OR REPLACE FUNCTION renumber_timeline_positions()
    RETURNS TRIGGER AS $$
    BEGIN
      UPDATE "event_timeline_item"
      SET "position" = subq.new_pos
      FROM (
        SELECT id, ROW_NUMBER() OVER (ORDER BY "position") AS new_pos
        FROM "event_timeline_item"
        WHERE "event_id" = OLD."event_id"
      ) subq
      WHERE "event_timeline_item"."id" = subq.id;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql
  `);

  await AppDataSource.query(`
    DROP TRIGGER IF EXISTS reorder_after_delete ON "event_timeline_item"
  `);

  await AppDataSource.query(`
    CREATE TRIGGER reorder_after_delete
    AFTER DELETE ON "event_timeline_item"
    FOR EACH ROW EXECUTE FUNCTION renumber_timeline_positions()
  `);

  await AppDataSource.query(`
    CREATE OR REPLACE VIEW "event_running_order" AS
    SELECT
      ti."id",
      ti."event_id",
      ti."position",
      ti."start_time",
      ti."duration_minutes",
      ti."type",
      ti."title",
      ti."notes",
      ti."event_artist_id",
      a."id"       AS "artist_id",
      a."name"     AS "artist_name",
      a."genre"    AS "artist_genre",
      a."imageUrl" AS "artist_image_url"
    FROM "event_timeline_item" ti
    LEFT JOIN "event_artist" ea ON ea."id" = ti."event_artist_id"
    LEFT JOIN "artist" a ON a."id" = ea."artistId"
    ORDER BY ti."event_id", ti."position"
  `);
});

afterAll(async () => {
  const { AppDataSource } = await import('../config/database');
  if (AppDataSource.isInitialized) {
    await AppDataSource.dropDatabase();
    await AppDataSource.destroy();
  }
});
