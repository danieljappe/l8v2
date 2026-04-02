# API Integration Documentation

## Overview

The frontend has been successfully connected to the backend API. All components now fetch real data from the database instead of using hardcoded mock data.

## API Configuration

### Environment Variables

Create a `.env` file in the `L8v2_FE` directory with the following variables:

```env
# API Configuration
VITE_API_URL=http://localhost:3000/api

# Development settings
VITE_DEV_MODE=true
```

### API Base URL

The default API base URL is `http://localhost:3000/api`. You can change this by setting the `VITE_API_URL` environment variable.

## API Services

### File Structure

```
src/
├── services/
│   └── api.ts          # API client and service functions
├── hooks/
│   └── useApi.ts       # React hooks for API calls
└── components/
    └── LoadingSpinner.tsx  # Loading component
```

### API Client

The `api.ts` file contains:
- Generic API client with error handling
- TypeScript interfaces for all data models
- Service functions for all API endpoints

### React Hooks

The `useApi.ts` file provides:
- `useApi<T>()` - Generic hook for data fetching
- `useMutation<T, R>()` - Hook for mutations (POST, PUT, DELETE)
- Specific hooks for each data type (events, artists, venues, etc.)

## Connected Components

### 1. UpcomingEvent Component
- **API Calls**: `useEvents()`, `useArtists()`
- **Features**:
  - Fetches upcoming events from the database
  - Displays event details (title, date, time, venue)
  - Shows artists associated with the event
  - Loading and error states
  - Fallback for no upcoming events

### 2. PreviousEventGallery Component
- **API Calls**: `useGalleryImages()`, `useEvents()`
- **Features**:
  - Fetches gallery images and events
  - Shows most recent past event
  - Displays event statistics
  - Fallback images if no gallery data

### 3. EventCalendar Component
- **API Calls**: `useEvents()`
- **Features**:
  - Interactive calendar with real event data
  - Month navigation
  - Event indicators on calendar days
  - Upcoming events list
  - Dynamic color coding for events

### 4. ContactSection Component
- **API Calls**: `useCreateContactMessage()`
- **Features**:
  - Form validation (required fields, email format)
  - Real-time form submission to backend
  - Success/error feedback
  - Loading states during submission
  - Form reset on successful submission

## Data Models

### Event
```typescript
interface Event {
  id: number;
  title: string;
  description: string;
  date: string;
  time: string;
  venue: Venue;
  eventArtists: EventArtist[];
  tickets?: Ticket[];
  createdAt: string;
  updatedAt: string;
}
```

### Artist
```typescript
interface Artist {
  id: string;
  name: string;
  genre: string;
  image: string;
  bio: string;
  social?: {
    instagram?: string;
    website?: string;
    youtube?: string;
  };
  createdAt: string;
  updatedAt: string;
}
```

### Venue
```typescript
interface Venue {
  id: number;
  name: string;
  address: string;
  city: string;
  capacity: number;
  description?: string;
  image?: string;
  events?: Event[];
  createdAt: string;
  updatedAt: string;
}
```

### GalleryImage
```typescript
interface GalleryImage {
  id: number;
  title: string;
  description?: string;
  imageUrl: string;
  eventId?: number;
  createdAt: string;
  updatedAt: string;
}
```

### ContactMessage
```typescript
interface ContactMessage {
  id: number;
  name: string;
  email: string;
  subject: string;
  message: string;
  createdAt: string;
  updatedAt: string;
}
```

## Error Handling

### Loading States
All components show loading spinners while fetching data:
```tsx
if (loading) {
  return <LoadingSpinner size="lg" text="Loading..." />;
}
```

### Error States
Components display error messages with retry options:
```tsx
if (error) {
  return (
    <div className="text-center">
      <p className="text-red-400 mb-4">Failed to load data</p>
      <button onClick={() => window.location.reload()}>
        Retry
      </button>
    </div>
  );
}
```

### Form Validation
Contact form includes:
- Required field validation
- Email format validation
- API error handling
- Success/error feedback

## Usage Examples

### Fetching Events
```tsx
import { useEvents } from '../hooks/useApi';

const MyComponent = () => {
  const { data: events, loading, error } = useEvents();
  
  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorComponent />;
  
  return (
    <div>
      {events?.map(event => (
        <EventCard key={event.id} event={event} />
      ))}
    </div>
  );
};
```

### Submitting Contact Form
```tsx
import { useCreateContactMessage } from '../hooks/useApi';

const ContactForm = () => {
  const { mutate: createMessage, loading } = useCreateContactMessage();
  
  const handleSubmit = async (formData) => {
    const result = await createMessage(formData);
    if (result?.error) {
      // Handle error
    } else {
      // Handle success
    }
  };
};
```

## Backend Requirements

Make sure your backend is running and has the following endpoints available:

- `GET /api/events` - Get all events
- `GET /api/artists` - Get all artists
- `GET /api/venues` - Get all venues
- `GET /api/gallery` - Get all gallery images
- `POST /api/contact` - Create contact message

## CORS Configuration

The backend should have CORS enabled to allow frontend requests:

```typescript
app.use(cors({
  origin: 'http://localhost:5173', // Vite dev server
  credentials: true
}));
```

## Testing the Integration

1. Start the backend server: `npm run dev` (in L8v2_BE)
2. Start the frontend: `npm run dev` (in L8v2_FE)
3. Navigate to `http://localhost:5173`
4. Check that all components load real data
5. Test the contact form submission
6. Verify that loading and error states work correctly

## Troubleshooting

### Common Issues

1. **CORS Errors**: Ensure backend CORS is configured correctly
2. **API URL Issues**: Check `VITE_API_URL` environment variable
3. **Database Connection**: Verify backend database is running
4. **Network Errors**: Check if backend server is running on correct port

### Debug Tips

1. Check browser network tab for API requests
2. Verify API responses in browser console
3. Check backend logs for errors
4. Use browser dev tools to inspect component state 