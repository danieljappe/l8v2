#!/bin/bash

# Setup automated database backups with cron
# This script sets up daily, weekly, and monthly backups

BACKUP_SCRIPT_PATH="$(pwd)/scripts/backup-db.sh"
CRON_USER=$(whoami)

echo "Setting up automated database backups for user: $CRON_USER"
echo "Backup script path: $BACKUP_SCRIPT_PATH"

# Make backup script executable
chmod +x "$BACKUP_SCRIPT_PATH"

# Create cron entries
echo "Setting up cron jobs..."

# Daily backup at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * cd $(pwd) && $BACKUP_SCRIPT_PATH data >> logs/backup.log 2>&1") | crontab -

# Weekly full backup on Sunday at 3 AM
(crontab -l 2>/dev/null; echo "0 3 * * 0 cd $(pwd) && $BACKUP_SCRIPT_PATH full >> logs/backup.log 2>&1") | crontab -

# Monthly schema backup on 1st of month at 4 AM
(crontab -l 2>/dev/null; echo "0 4 1 * * cd $(pwd) && $BACKUP_SCRIPT_PATH schema >> logs/backup.log 2>&1") | crontab -

# Create logs directory
mkdir -p logs

echo "✅ Cron jobs set up successfully!"
echo ""
echo "Backup schedule:"
echo "  Daily (data only): 2:00 AM"
echo "  Weekly (full): Sunday 3:00 AM"
echo "  Monthly (schema): 1st of month 4:00 AM"
echo ""
echo "To view cron jobs: crontab -l"
echo "To edit cron jobs: crontab -e"
echo "To remove all cron jobs: crontab -r"
echo ""
echo "Backup logs will be written to: logs/backup.log"
