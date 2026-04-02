# L8 Platform Development Guide

This guide explains how to develop and run the L8 Events and L8 Booking platforms locally.

## Overview

The L8 platform has been split into two distinct but interconnected services:

- **L8 Events** (Port 3000) - Event management platform
- **L8 Booking** (Port 3001) - Artist booking bureau

## Development Setup

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Git

### Installation

1. Install dependencies:
```bash
npm install
```

2. Install cross-env globally (if not already installed):
```bash
npm install -g cross-env
```

### Running the Platforms

#### Option 1: Run Both Platforms Simultaneously
```bash
npm run dev:platforms
```

This will start both platforms with colored console output:
- **Events Platform**: http://localhost:3000
- **Booking Platform**: http://localhost:3001

#### Option 2: Run Platforms Individually

**Events Platform Only:**
```bash
npm run dev:events
```

**Booking Platform Only:**
```bash
npm run dev:booking
```

#### Option 3: Standard Development
```bash
npm run dev
```

### Platform Detection

The application automatically detects which platform to run based on:

1. **Subdomain** (production):
   - `events.l8events.dk` → Events platform
   - `booking.l8events.dk` → Booking platform
   - `l8events.dk` → Platform choice screen

2. **Port** (development):
   - `localhost:3000` → Events platform
   - `localhost:3001` → Booking platform
   - `localhost:5173` → Platform choice screen

3. **Environment Variable**:
   - `VITE_PLATFORM=events` → Events platform
   - `VITE_PLATFORM=booking` → Booking platform

## Project Structure

```
L8v2_FE/
├── src/
│   ├── components/
│   │   ├── shared/           # Shared components between platforms
│   │   │   ├── SharedHeader.tsx
│   │   │   └── ArtistCard.tsx
│   │   ├── PlatformChoice.tsx
│   │   └── PlatformRouter.tsx
│   ├── contexts/
│   │   └── SharedAuthContext.tsx
│   ├── pages/
│   │   ├── Home.tsx          # Platform choice + Events home
│   │   ├── Booking.tsx       # Booking platform home
│   │   └── ...
│   ├── utils/
│   │   └── subdomainUtils.ts
│   └── ...
├── scripts/
│   └── dev-platforms.js      # Multi-platform dev script
└── ...
```

## Key Features

### Platform Choice Interface
- Beautiful landing page with platform selection
- Visual separation between L8 Events and L8 Booking
- Mobile-responsive design
- Persistent user choice

### Cross-Platform Navigation
- Automatic subdomain detection
- Cross-referencing links between platforms
- Seamless navigation experience

### Shared Components
- `SharedHeader` - Platform-aware navigation
- `ArtistCard` - Reusable artist display component
- `SharedAuthContext` - Unified authentication

### Development Tools
- Multi-platform development script
- Colored console output
- Hot reload for both platforms
- Environment-based configuration

## Building for Production

### Build Both Platforms
```bash
npm run build:events
npm run build:booking
```

### Build Individual Platform
```bash
npm run build:events    # Events platform only
npm run build:booking   # Booking platform only
```

## Deployment

### Subdomain Setup
1. Configure DNS for subdomains:
   - `events.l8events.dk` → Events platform
   - `booking.l8events.dk` → Booking platform
   - `l8events.dk` → Platform choice

2. Deploy each platform to its respective subdomain

3. Configure SSL certificates for all domains

### Environment Variables
- `VITE_PLATFORM` - Platform identifier (events/booking)
- `VITE_API_URL` - Backend API URL
- `VITE_CDN_URL` - CDN URL for assets

## Troubleshooting

### Port Conflicts
If ports 3000 or 3001 are in use:
1. Kill the processes using those ports
2. Or modify the port numbers in `package.json` scripts

### Platform Not Loading
1. Check console for errors
2. Verify environment variables
3. Clear browser cache and localStorage
4. Check subdomain configuration

### Cross-Platform Navigation Issues
1. Verify subdomain detection logic
2. Check redirect URLs
3. Test on actual subdomains, not localhost

## Next Steps

1. **Phase 2**: Implement L8 Booking features
2. **Phase 3**: Update L8 Events platform
3. **Phase 4**: Gallery enhancements
4. **Phase 5**: Database refactoring

## Support

For development issues, check:
1. Console logs for errors
2. Network tab for failed requests
3. Application state in React DevTools
4. LocalStorage for platform choice persistence
