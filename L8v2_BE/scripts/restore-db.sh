#!/bin/bash

# Database restore script for L8v2 production
# Usage: ./restore-db.sh <backup_file> [options]

if [ $# -eq 0 ]; then
    echo "Usage: $0 <backup_file> [options]"
    echo "Options:"
    echo "  --dry-run    Show what would be restored without executing"
    echo "  --force      Skip confirmation prompts"
    echo ""
    echo "Examples:"
    echo "  $0 backups/l8v2_full_backup_20241201_020000.sql"
    echo "  $0 backups/l8v2_full_backup_20241201_020000.sql.gz"
    echo "  $0 backups/l8v2_full_backup_20241201_020000.sql --dry-run"
    exit 1
fi

BACKUP_FILE="$1"
DRY_RUN=false
FORCE=false

# Parse options
shift
while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --force)
            FORCE=true
            shift
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Configuration
DB_HOST="${DB_HOST:-localhost}"
DB_PORT="${DB_PORT:-5432}"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-l8v2}"

# Check if backup file exists
if [ ! -f "$BACKUP_FILE" ]; then
    echo "❌ Backup file not found: $BACKUP_FILE"
    exit 1
fi

# Check if file is compressed
if [[ "$BACKUP_FILE" == *.gz ]]; then
    echo "📦 Detected compressed backup file"
    COMPRESSED=true
    ORIGINAL_FILE="$BACKUP_FILE"
    BACKUP_FILE="${BACKUP_FILE%.gz}"
    
    # Decompress temporarily
    echo "Extracting backup file..."
    gunzip -c "$ORIGINAL_FILE" > "$BACKUP_FILE"
    if [ $? -ne 0 ]; then
        echo "❌ Failed to extract backup file"
        exit 1
    fi
else
    COMPRESSED=false
fi

# Show backup file info
echo "📋 Backup file: $BACKUP_FILE"
echo "📊 File size: $(du -h "$BACKUP_FILE" | cut -f1)"
echo "📅 File date: $(stat -c %y "$BACKUP_FILE")"

# Preview backup contents
echo ""
echo "🔍 Preview of backup contents:"
head -20 "$BACKUP_FILE" | grep -E "(CREATE TABLE|INSERT INTO|--)" | head -10

# Safety checks
echo ""
echo "⚠️  IMPORTANT SAFETY CHECKS:"
echo "   - Target database: $DB_NAME"
echo "   - Target host: $DB_HOST:$DB_PORT"
echo "   - Target user: $DB_USER"

if [ "$FORCE" != true ]; then
    echo ""
    read -p "Are you sure you want to restore to this database? (yes/no): " CONFIRM
    if [ "$CONFIRM" != "yes" ]; then
        echo "Restore cancelled."
        [ "$COMPRESSED" = true ] && rm -f "$BACKUP_FILE"
        exit 0
    fi
    
    read -p "Type 'RESTORE' to confirm: " CONFIRM_RESTORE
    if [ "$CONFIRM_RESTORE" != "RESTORE" ]; then
        echo "Restore cancelled."
        [ "$COMPRESSED" = true ] && rm -f "$BACKUP_FILE"
        exit 0
    fi
fi

# Perform restore
echo ""
if [ "$DRY_RUN" = true ]; then
    echo "🔍 DRY RUN MODE - No changes will be made"
    echo "Would execute: psql -h $DB_HOST -p $DB_PORT -U $DB_USER -d $DB_NAME -f $BACKUP_FILE"
else
    echo "🚀 Starting database restore..."
    
    # Set password environment variable
    export PGPASSWORD="$DB_PASSWORD"
    
    # Perform the restore
    psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -f "$BACKUP_FILE"
    
    if [ $? -eq 0 ]; then
        echo "✅ Database restore completed successfully!"
    else
        echo "❌ Database restore failed!"
        [ "$COMPRESSED" = true ] && rm -f "$BACKUP_FILE"
        exit 1
    fi
    
    # Clear password
    unset PGPASSWORD
fi

# Cleanup temporary files
if [ "$COMPRESSED" = true ]; then
    rm -f "$BACKUP_FILE"
    echo "🧹 Cleaned up temporary files"
fi

echo ""
echo "🎉 Restore process completed!"
