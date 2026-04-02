import { MigrationInterface, QueryRunner } from "typeorm";

export class FixEventTicketPrice1700000000004 implements MigrationInterface {
    name = 'FixEventTicketPrice1700000000004'

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Change ticketPrice column from integer to decimal
        await queryRunner.query(`
            ALTER TABLE "event" 
            ALTER COLUMN "ticketPrice" TYPE DECIMAL(10,2)
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert back to integer
        await queryRunner.query(`
            ALTER TABLE "event" 
            ALTER COLUMN "ticketPrice" TYPE INTEGER
        `);
    }
}
