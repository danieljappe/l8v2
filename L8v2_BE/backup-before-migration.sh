#!/bin/bash

# Backup script for production migration
# Run this BEFORE running migrations in production

echo "🔄 Creating database backup before migration..."

# Get current timestamp
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
BACKUP_FILE="backup_before_migration_${TIMESTAMP}.sql"

# Database connection details (update these for your production environment)
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_NAME="${DB_NAME:-l8v2}"
DB_USER="${DB_USER:-postgres}"

echo "📊 Backing up database to: ${BACKUP_FILE}"

# Create backup
pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" > "$BACKUP_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Backup created successfully: ${BACKUP_FILE}"
    echo "📁 Backup location: $(pwd)/${BACKUP_FILE}"
    echo ""
    echo "🔄 To restore from this backup if needed:"
    echo "   psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME < $BACKUP_FILE"
else
    echo "❌ Backup failed! Please check your database connection and try again."
    exit 1
fi
