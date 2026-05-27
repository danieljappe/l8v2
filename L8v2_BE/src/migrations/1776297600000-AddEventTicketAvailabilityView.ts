import { MigrationInterface, QueryRunner } from "typeorm";

/**
 * Creates a PostgreSQL VIEW that computes the categorized ticket availability indicator
 * for events with a linked Billetto projection. The indicator is derived from the local
 * billetto_event_data projection so public event views never depend on a live Billetto
 * API call at request time.
 *
 * Categories (Danish labels matching the frontend):
 *   Billetter til salg  — tickets available, capacity not close to full
 *   Få billetter tilbage — ≤ 20 % of capacity remaining
 *   Sidste billetter    — ≤ 5 % of capacity remaining
 *   Udsolgt             — 0 tickets available
 */
export class AddEventTicketAvailabilityView1776297600000 implements MigrationInterface {
    name = 'AddEventTicketAvailabilityView1776297600000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE VIEW event_ticket_availability AS
            SELECT
                e.id                   AS "eventId",
                e.title,
                bed."billettoEventId",
                bed."ticketsAvailable",
                bed."maxCapacity",
                bed."publicUrl",
                bed."lastSyncedAt",
                CASE
                    WHEN bed."ticketsAvailable" IS NULL
                        THEN NULL
                    WHEN bed."ticketsAvailable" = 0
                        THEN 'Udsolgt'
                    WHEN bed."maxCapacity" IS NOT NULL
                         AND bed."ticketsAvailable"::float / NULLIF(bed."maxCapacity", 0) <= 0.05
                        THEN 'Sidste billetter'
                    WHEN bed."maxCapacity" IS NOT NULL
                         AND bed."ticketsAvailable"::float / NULLIF(bed."maxCapacity", 0) <= 0.20
                        THEN 'Få billetter tilbage'
                    ELSE 'Billetter til salg'
                END AS "availabilityLabel"
            FROM "event" e
            JOIN "billetto_event_data" bed ON bed."eventId" = e.id;
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP VIEW IF EXISTS event_ticket_availability`);
    }
}
