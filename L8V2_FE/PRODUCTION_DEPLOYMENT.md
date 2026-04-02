# L8 Platform Production Deployment Guide

## Overview
This guide covers deploying the new L8 platform split to production, including subdomain configuration, DNS setup, and deployment procedures.

## Prerequisites
- Domain access (l8events.dk)
- DNS management access
- SSL certificate management
- Production server access
- CDN configuration access

---

## 1. DNS Configuration

### Subdomain Setup
Configure the following subdomains in your DNS provider:

```
l8events.dk          → Main platform choice page
events.l8events.dk   → L8 Events platform
booking.l8events.dk  → L8 Booking platform
```

### DNS Records
Add these A records (or CNAME if using CDN):

```
Type: A
Name: l8events.dk
Value: [YOUR_SERVER_IP]

Type: A  
Name: events.l8events.dk
Value: [YOUR_SERVER_IP]

Type: A
Name: booking.l8events.dk  
Value: [YOUR_SERVER_IP]
```

---

## 2. SSL Certificate Configuration

### Wildcard Certificate (Recommended)
Obtain a wildcard SSL certificate for `*.l8events.dk` to cover all subdomains:

```bash
# Using Let's Encrypt with Certbot
certbot certonly --manual --preferred-challenges dns -d l8events.dk -d *.l8events.dk
```

### Individual Certificates (Alternative)
If wildcard is not available, obtain separate certificates:
- `l8events.dk`
- `events.l8events.dk` 
- `booking.l8events.dk`

---

## 3. Server Configuration

### Nginx Configuration

Create separate server blocks for each subdomain:

#### Main Domain (l8events.dk)
```nginx
server {
    listen 443 ssl http2;
    server_name l8events.dk;
    
    ssl_certificate /path/to/l8events.dk.crt;
    ssl_certificate_key /path/to/l8events.dk.key;
    
    root /var/www/l8-platform/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Events Subdomain (events.l8events.dk)
```nginx
server {
    listen 443 ssl http2;
    server_name events.l8events.dk;
    
    ssl_certificate /path/to/l8events.dk.crt;
    ssl_certificate_key /path/to/l8events.dk.key;
    
    root /var/www/l8-platform/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

#### Booking Subdomain (booking.l8events.dk)
```nginx
server {
    listen 443 ssl http2;
    server_name booking.l8events.dk;
    
    ssl_certificate /path/to/l8events.dk.crt;
    ssl_certificate_key /path/to/l8events.dk.key;
    
    root /var/www/l8-platform/dist;
    index index.html;
    
    location / {
        try_files $uri $uri/ /index.html;
    }
    
    # API proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

### HTTP to HTTPS Redirect
```nginx
server {
    listen 80;
    server_name l8events.dk events.l8events.dk booking.l8events.dk;
    return 301 https://$server_name$request_uri;
}
```

---

## 4. Build and Deployment

### Build Commands
```bash
# Build for production
npm run build

# Or build specific platforms
npm run build:events
npm run build:booking
```

### Deployment Structure
```
/var/www/l8-platform/
├── dist/                    # Built frontend
├── api/                     # Backend API
├── nginx/                   # Nginx configs
└── ssl/                     # SSL certificates
```

### Deployment Script
```bash
#!/bin/bash
# deploy.sh

echo "Building L8 Platform..."
npm run build

echo "Copying files to production..."
rsync -avz --delete dist/ user@server:/var/www/l8-platform/dist/

echo "Restarting Nginx..."
ssh user@server "sudo systemctl reload nginx"

echo "Deployment complete!"
```

---

## 5. Environment Variables

### Frontend Environment
Create `.env.production`:
```env
VITE_API_URL=https://api.l8events.dk
VITE_CDN_URL=https://cdn.l8events.dk
VITE_PLATFORM=main
```

### Backend Environment
Update backend environment:
```env
CORS_ORIGIN=https://l8events.dk,https://events.l8events.dk,https://booking.l8events.dk
FRONTEND_URL=https://l8events.dk
```

---

## 6. CDN Configuration

### CloudFlare Setup (Recommended)
1. Add all domains to CloudFlare
2. Enable SSL/TLS encryption
3. Configure page rules:
   - `events.l8events.dk/*` → Cache Level: Cache Everything
   - `booking.l8events.dk/*` → Cache Level: Cache Everything
   - `l8events.dk` → Cache Level: Bypass

### CDN Headers
```nginx
# Cache static assets
location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

---

## 7. Database Updates

### No Database Changes Required
The current database structure supports both platforms without modifications.

### Optional: Platform Tracking
Add platform tracking to analytics:
```sql
ALTER TABLE events ADD COLUMN platform VARCHAR(20) DEFAULT 'events';
ALTER TABLE artists ADD COLUMN platform VARCHAR(20) DEFAULT 'booking';
```

---

## 8. Testing Checklist

### Pre-Deployment Testing
- [ ] Platform choice page loads on main domain
- [ ] Events platform loads on events subdomain
- [ ] Booking platform loads on booking subdomain
- [ ] Cross-platform navigation works
- [ ] Mobile responsiveness on all platforms
- [ ] SSL certificates valid for all domains
- [ ] API endpoints accessible from all platforms

### Post-Deployment Testing
- [ ] All subdomains resolve correctly
- [ ] HTTPS redirects working
- [ ] Platform choice persistence works
- [ ] Cross-platform links function
- [ ] Performance metrics acceptable
- [ ] Error monitoring active

---

## 9. Monitoring and Analytics

### Error Monitoring
Set up error tracking for each platform:
- Main domain errors
- Events platform errors  
- Booking platform errors

### Analytics Configuration
```javascript
// Google Analytics with platform tracking
gtag('config', 'GA_MEASUREMENT_ID', {
  custom_map: {
    'custom_parameter_1': 'platform'
  }
});

// Track platform choice
gtag('event', 'platform_choice', {
  'platform': 'events' // or 'booking'
});
```

---

## 10. Rollback Plan

### Quick Rollback
If issues occur, quickly revert to single platform:

1. **DNS Rollback**:
   ```bash
   # Point all subdomains to main domain
   events.l8events.dk → l8events.dk
   booking.l8events.dk → l8events.dk
   ```

2. **Code Rollback**:
   ```bash
   git checkout previous-stable-version
   npm run build
   # Deploy previous version
   ```

3. **Database Rollback**:
   - No database changes to rollback
   - Data remains intact

---

## 11. Performance Optimization

### Image Optimization
- Implement WebP format for images
- Use responsive images with srcset
- Lazy load images below the fold

### Code Splitting
- Implement route-based code splitting
- Lazy load platform-specific components
- Optimize bundle sizes

### Caching Strategy
- Static assets: 1 year
- HTML pages: 1 hour
- API responses: 5 minutes

---

## 12. Security Considerations

### CORS Configuration
Ensure backend allows all subdomains:
```javascript
const corsOptions = {
  origin: [
    'https://l8events.dk',
    'https://events.l8events.dk', 
    'https://booking.l8events.dk'
  ],
  credentials: true
};
```

### Content Security Policy
```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-inline'; 
               style-src 'self' 'unsafe-inline';">
```

---

## 13. Post-Deployment Tasks

### Immediate (0-24 hours)
- [ ] Monitor error rates
- [ ] Check performance metrics
- [ ] Verify all functionality works
- [ ] Test on multiple devices/browsers

### Short-term (1-7 days)
- [ ] Monitor user behavior
- [ ] Collect feedback
- [ ] Optimize based on usage patterns
- [ ] Update documentation

### Long-term (1-4 weeks)
- [ ] Analyze platform usage data
- [ ] Plan Phase 2 implementation
- [ ] Consider additional optimizations
- [ ] Plan future enhancements

---

## 14. Support and Maintenance

### User Support
- Update support documentation
- Train support team on new platform structure
- Create FAQ for platform choice

### Technical Maintenance
- Regular SSL certificate renewal
- Monitor subdomain performance
- Update dependencies regularly
- Backup configurations

---

## Contact Information

For deployment issues or questions:
- **Technical Lead**: [Your Name]
- **DevOps**: [DevOps Contact]
- **Domain/DNS**: [DNS Provider Contact]

---

**Deployment Date**: [To be filled]
**Deployed By**: [Your Name]
**Version**: v1.0.0-platform-split
