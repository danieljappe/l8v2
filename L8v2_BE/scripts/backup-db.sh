#!/bin/bash

# Database backup script for L8v2 production
# Usage: ./backup-db.sh [backup_type]

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-l8v2}"
BACKUP_DIR="./backups"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_TYPE="${1:-full}"

# Create backup directory if it doesn't exist
mkdir -p "$BACKUP_DIR"

# Set backup filename
case $BACKUP_TYPE in
    "full")
        BACKUP_FILE="$BACKUP_DIR/l8v2_full_backup_$DATE.sql"
        BACKUP_OPTIONS="--clean --create --if-exists"
        ;;
    "data")
        BACKUP_FILE="$BACKUP_DIR/l8v2_data_backup_$DATE.sql"
        BACKUP_OPTIONS="--data-only"
        ;;
    "schema")
        BACKUP_FILE="$BACKUP_DIR/l8v2_schema_backup_$DATE.sql"
        BACKUP_OPTIONS="--schema-only"
        ;;
    *)
        echo "Usage: $0 [full|data|schema]"
        echo "  full: Complete backup (schema + data)"
        echo "  data: Data only backup"
        echo "  schema: Schema only backup"
        exit 1
        ;;
esac

echo "Starting $BACKUP_TYPE backup..."
echo "Database: $DB_NAME"
echo "Backup file: $BACKUP_FILE"

# Perform the backup
PGPASSWORD="$DB_PASSWORD" pg_dump \
    -h "$DB_HOST" \
    -p "$DB_PORT" \
    -U "$DB_USER" \
    -d "$DB_NAME" \
    $BACKUP_OPTIONS \
    --verbose \
    --no-password \
    --file "$BACKUP_FILE"

# Check if backup was successful
if [ $? -eq 0 ]; then
    echo "✅ Backup completed successfully!"
    echo "File size: $(du -h "$BACKUP_FILE" | cut -f1)"
    
    # Compress the backup
    gzip "$BACKUP_FILE"
    echo "Compressed backup: ${BACKUP_FILE}.gz"
    
    # Keep only last 7 backups
    find "$BACKUP_DIR" -name "*.gz" -mtime +7 -delete
    echo "Cleaned up backups older than 7 days"
    
    # Optional: Upload to cloud storage (uncomment and configure)
    # aws s3 cp "${BACKUP_FILE}.gz" "s3://your-bucket/backups/"
    
else
    echo "❌ Backup failed!"
    exit 1
fi
