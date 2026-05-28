import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveTimelineCollabJson1776816000000 implements MigrationInterface {
    name = 'RemoveTimelineCollabJson1776816000000';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Remove JSON collab metadata from notes now that the join table is the source of truth
        await queryRunner.query(`
            UPDATE "event_timeline_item"
            SET "notes" = NULL
            WHERE "type" = 'collab_set'
              AND "notes" IS NOT NULL
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Cannot restore deleted notes — no-op down
    }
}
