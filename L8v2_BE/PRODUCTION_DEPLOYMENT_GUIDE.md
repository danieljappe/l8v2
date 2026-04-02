# 🚀 Production Deployment Guide - Embedding Feature

## Overview
This guide covers deploying the new embedding functionality to production, including safe database migrations and deployment steps.

## ⚠️ Pre-Deployment Checklist

### 1. Backup Database
```bash
# Create a full database backup
./backup-before-migration.sh

# Or manually:
pg_dump -h your_host -p 5432 -U your_user -d your_db > backup_$(date +%Y%m%d_%H%M%S).sql
```

### 2. Test on Staging
- [ ] Deploy to staging environment first
- [ ] Test all embedding functionality
- [ ] Verify database migrations work
- [ ] Test with real embed codes (Spotify, YouTube, SoundCloud)

### 3. Code Review
- [ ] All migrations are safe (check for column existence)
- [ ] XSS protection is in place
- [ ] Error handling is robust

## 🗄️ Database Migrations

### Safe Migration Process
The migrations have been updated to be safe for production:

1. **AddBillettoURLToEvent** - Checks if column exists before adding
2. **AddEmbeddingsToArtist** - Checks if column exists before adding

### Run Migrations
```bash
# Option 1: Use the safe migration runner
node run-production-migrations.js

# Option 2: Run directly
npm run migration:run
```

### If Migration Fails
```bash
# Check migration status
npm run migration:show

# Revert last migration (if needed)
npm run migration:revert

# Restore from backup
psql -h your_host -U your_user -d your_db < backup_file.sql
```

## 🔧 Environment Configuration

### Required Environment Variables
```env
# Database
DATABASE_URL=postgresql://user:password@host:port/database

# Application
NODE_ENV=production
PORT=3000

# Security (if using JWT)
JWT_SECRET=your_jwt_secret
```

### Content Security Policy (CSP)
Add these to your web server configuration to allow embeds:

```nginx
# Nginx
add_header Content-Security-Policy "frame-src 'self' open.spotify.com youtube.com youtu.be w.soundcloud.com;";

# Apache
Header always set Content-Security-Policy "frame-src 'self' open.spotify.com youtube.com youtu.be w.soundcloud.com;"
```

## 🚀 Deployment Steps

### 1. Prepare Production Server
```bash
# SSH into production server
ssh user@your-server

# Navigate to application directory
cd /var/www/L8v2_BE

# Pull latest code
git pull origin master

# Install dependencies
npm install --production
```

### 2. Run Database Migrations
```bash
# Create backup first
./backup-before-migration.sh

# Run migrations
node run-production-migrations.js
```

### 3. Build and Deploy
```bash
# Build the application
npm run build

# Restart the application
pm2 restart l8v2-backend
# or
systemctl restart your-app-service
```

### 4. Deploy Frontend
```bash
cd /var/www/L8v2_FE

# Pull latest code
git pull origin master

# Install dependencies
npm install

# Build for production
npm run build

# Restart web server
systemctl reload nginx
# or
systemctl reload apache2
```

## ✅ Post-Deployment Verification

### 1. Test Embedding Functionality
- [ ] Create new artist with embeddings
- [ ] Edit existing artist to add embeddings
- [ ] View artist details with embeddings
- [ ] Test all three platforms (Spotify, YouTube, SoundCloud)

### 2. Check Database
```sql
-- Verify columns exist
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'artist' AND column_name = 'embeddings';

SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'event' AND column_name = 'billettoURL';
```

### 3. Monitor Application
- [ ] Check application logs for errors
- [ ] Monitor database performance
- [ ] Verify all API endpoints work
- [ ] Test admin functionality

## 🔄 Rollback Plan

If issues occur after deployment:

### 1. Quick Rollback (Code Only)
```bash
# Revert to previous commit
git reset --hard HEAD~1

# Rebuild and restart
npm run build
pm2 restart l8v2-backend
```

### 2. Full Rollback (Including Database)
```bash
# Revert database migrations
npm run migration:revert

# Restore from backup
psql -h your_host -U your_user -d your_db < backup_file.sql

# Revert code
git reset --hard HEAD~1
npm run build
pm2 restart l8v2-backend
```

## 📊 Monitoring

### Key Metrics to Watch
- Database query performance
- Memory usage
- Error rates
- Page load times (embeds can be heavy)

### Log Monitoring
```bash
# Application logs
pm2 logs l8v2-backend

# Database logs
tail -f /var/log/postgresql/postgresql-*.log

# Web server logs
tail -f /var/log/nginx/access.log
tail -f /var/log/nginx/error.log
```

## 🛡️ Security Considerations

### XSS Protection
- Embed codes are sanitized before storage
- Only iframe embeds are allowed
- All user input is validated

### Content Security Policy
- Only trusted domains allowed for embeds
- No inline scripts from embeds

### Database Security
- All queries use parameterized statements
- JSON columns are properly escaped

## 📞 Support

If you encounter issues:

1. Check the logs first
2. Verify database migrations completed
3. Test with a simple embed code
4. Check CSP headers if embeds don't load
5. Verify all environment variables are set

## 🎉 Success Criteria

Deployment is successful when:
- [ ] All migrations completed without errors
- [ ] Artists can be created/edited with embeddings
- [ ] Embeddings display correctly in artist modals
- [ ] Admin can manage embeddings
- [ ] No errors in application logs
- [ ] Performance is acceptable

---

**Remember**: Always test in staging first and have a rollback plan ready!
