# Production Database Backup Guide

This guide covers comprehensive backup strategies for your L8v2 production database.

## 🚨 Critical Backup Requirements

### Before Running Migrations
- **ALWAYS backup your database before running migrations**
- Test migrations on a copy of production data
- Have a rollback plan ready

### Backup Frequency
- **Daily**: Data-only backups (2:00 AM)
- **Weekly**: Full database backups (Sunday 3:00 AM)
- **Before Deployments**: Manual full backup
- **Before Major Changes**: Schema + data backup

## 📋 Backup Types

### 1. Full Backup (Recommended for Production)
```bash
# Linux/Mac
./scripts/backup-db.sh full

# Windows PowerShell
.\scripts\backup-db.ps1 full
```
- Includes schema and all data
- Can restore entire database
- Use before major changes

### 2. Data-Only Backup
```bash
./scripts/backup-db.sh data
```
- Only user data (no schema)
- Faster and smaller
- Good for daily backups

### 3. Schema-Only Backup
```bash
./scripts/backup-db.sh schema
```
- Only table structures
- No user data
- Good for version control

## 🔄 Automated Backup Setup

### Linux/Mac (Cron)
```bash
# Make script executable
chmod +x scripts/backup-db.sh

# Setup automated backups
./scripts/setup-backup-cron.sh
```

### Windows (Task Scheduler)
1. Open Task Scheduler
2. Create Basic Task
3. Set trigger (daily at 2:00 AM)
4. Action: Start a program
5. Program: `powershell.exe`
6. Arguments: `-ExecutionPolicy Bypass -File "C:\path\to\L8v2_BE\scripts\backup-db.ps1"`

## 🗂️ Backup Storage Strategy

### Local Storage
- Store in `./backups/` directory
- Automatically compressed with gzip
- 7-day retention policy

### Cloud Storage (Recommended)
```bash
# AWS S3 (uncomment in backup script)
aws s3 cp backup_file.gz s3://your-bucket/backups/

# Google Cloud Storage
gsutil cp backup_file.gz gs://your-bucket/backups/

# Azure Blob Storage
az storage blob upload --file backup_file.gz --container backups
```

### Offsite Backup
- Store backups in different geographic regions
- Use multiple cloud providers
- Test restore procedures regularly

## 🔍 Backup Verification

### Check Backup Integrity
```bash
# Verify backup file
./scripts/restore-db.sh backup_file.sql --dry-run

# Check backup logs
tail -f logs/backup.log
```

### Test Restore Process
1. Create test database
2. Restore backup to test database
3. Verify data integrity
4. Test application functionality

## 🚀 Pre-Migration Backup Checklist

### Before Running Any Migration
- [ ] Full database backup completed
- [ ] Backup verified and tested
- [ ] Backup stored offsite
- [ ] Rollback plan documented
- [ ] Team notified of maintenance window

### Migration Day
- [ ] Final backup before migration
- [ ] Migration executed
- [ ] Application tested
- [ ] Backup after successful migration
- [ ] Rollback plan ready if needed

## 🆘 Disaster Recovery

### Database Corruption
1. Stop application
2. Restore from latest backup
3. Check data integrity
4. Restart application

### Complete Server Failure
1. Provision new server
2. Install PostgreSQL
3. Restore database from backup
4. Update application configuration
5. Test full system

### Data Loss Scenarios
- **Accidental deletion**: Restore from backup
- **Migration failure**: Rollback to previous version
- **Hardware failure**: Restore to new hardware

## 📊 Backup Monitoring

### Health Checks
```bash
# Check backup status
ls -la backups/

# Monitor backup sizes
du -sh backups/*

# Check backup age
find backups/ -name "*.gz" -mtime +1
```

### Alerting
- Set up monitoring for backup failures
- Alert on missed backups
- Monitor backup file sizes (unusual changes)
- Check backup completion times

## 🔧 Troubleshooting

### Common Issues
- **Permission denied**: Check file permissions
- **Disk space**: Monitor available space
- **Network issues**: Check database connectivity
- **Compression errors**: Verify gzip installation

### Recovery Commands
```bash
# View backup contents
zcat backup_file.gz | head -50

# Extract backup manually
gunzip backup_file.gz

# Check backup format
file backup_file.sql
```

## 📞 Emergency Contacts

- **Database Administrator**: [Your Name]
- **System Administrator**: [SysAdmin Name]
- **Backup Storage Provider**: [Cloud Provider Support]

## 📝 Backup Log Template

```
Date: [Date]
Type: [Full/Data/Schema]
Size: [File Size]
Duration: [Backup Time]
Status: [Success/Failed]
Notes: [Any issues or observations]
```

---

**Remember**: A backup is only as good as your ability to restore from it. Test your restore procedures regularly!
