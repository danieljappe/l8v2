# TypeORM Migrations Guide

This project uses TypeORM migrations to manage database schema changes. Migrations provide a safe and version-controlled way to update your database schema.

## Prerequisites

Make sure you have:
- PostgreSQL database running
- Environment variables configured (see `.env` file)
- All dependencies installed (`npm install`)

## Available Migration Commands

### Generate a new migration
```bash
npm run migration:generate -- src/migrations/MigrationName
```
This will compare your current entity definitions with the database and generate a migration file.

### Create an empty migration
```bash
npm run migration:create -- src/migrations/MigrationName
```
This creates an empty migration file where you can write custom SQL.

### Run pending migrations
```bash
npm run migration:run
```
This applies all pending migrations to your database.

### Revert the last migration
```bash
npm run migration:revert
```
This undoes the last applied migration.

### Show migration status
```bash
npm run migration:show
```
This displays which migrations have been applied and which are pending.

## Migration Workflow

1. **Development**: Make changes to your entity models
2. **Generate Migration**: Run `npm run migration:generate` to create a migration
3. **Review**: Check the generated migration file and modify if needed
4. **Test**: Test the migration on a development database
5. **Apply**: Run `npm run migration:run` to apply the migration
6. **Commit**: Commit both the entity changes and migration file

## Important Notes

- **Never modify existing migration files** that have been applied to production
- **Always backup your database** before running migrations in production
- **Test migrations** on a copy of your production data first
- **Disable `synchronize: true`** in production - use migrations instead

## Database Schema

The initial migration creates the following tables:
- `users` - User accounts and authentication
- `venues` - Event venues and locations
- `artists` - Musical artists and performers
- `events` - Event information and details
- `tickets` - Ticket purchases and reservations
- `gallery_images` - Event photos and images
- `contact_messages` - Contact form submissions
- `event_artists` - Many-to-many relationship between events and artists

## Troubleshooting

### Migration fails to run
- Check database connection
- Verify environment variables
- Ensure database user has proper permissions

### Schema out of sync
- Run `npm run migration:show` to see migration status
- Check if all migrations have been applied
- Verify entity definitions match database schema

### Need to reset database
- Drop all tables manually
- Delete migration records from `migrations` table (if exists)
- Run `npm run migration:run` to recreate schema
