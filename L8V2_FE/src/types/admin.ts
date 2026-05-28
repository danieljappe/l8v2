export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  time: string;
  endTime?: string;
  venue: string;
  artist: string;
  artists?: string[];
  price: number;
  capacity: number;
  image: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  createdAt: string;
  eventArtists?: {
    id: string;
    artist: {
      id: string;
      name: string;
    };
  }[];
  timeline?: TimelineItem[];
  // Add backend-compatible fields
  ticketPrice?: number;
  totalTickets?: number;
  soldTickets?: number;
  maxCapacity?: number;
  isActive?: boolean;
  currentAttendees?: number;
  startTime?: string;
  imageUrl?: string;
  billettoURL?: string;
  updatedAt?: string;
}

export interface Artist {
  id: string;
  name: string;
  bio?: string;
  imageUrl?: string;
  website?: string;
  socialMedia?: {
    platform: string;
    url: string;
  }[];
  embeddings?: {
    id: string;
    platform: 'spotify' | 'youtube' | 'soundcloud';
    embedCode: string;
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    createdAt: string;
  }[];
  genre?: string;
  isBookable: boolean;
  bookingUserId?: string;
  bookingUser?: {
    id: string;
    email: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    imageUrl?: string;
    role?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city?: string;
  description?: string;
  amenities: string[];
  imageUrl?: string;
  images?: string[];
  mapEmbedHtml?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface GalleryItem {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
  caption?: string;
  eventId?: string | null;
  photographer?: string;
  tags?: string[];
  category: 'event' | 'venue' | 'artist' | 'other';
  orderIndex: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Message {
  id: string;
  name: string;
  email: string;
  subject: string;
  message: string;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  status?: 'pending' | 'read' | 'replied' | 'archived';
  phone?: string;
  artistType?: string;
  createdAt: string;
}

export type AdminSection = 'dashboard' | 'events' | 'artists' | 'venues' | 'gallery' | 'messages' | 'users' | 'account' | 'logs';

export type TimelineItemType = 'artist_set' | 'break' | 'dj_set' | 'talk' | 'custom';

export interface TimelineItem {
  id: string;
  eventId: string;
  position: number;
  startTime?: string;
  durationMinutes?: number;
  type: TimelineItemType;
  title: string;
  notes?: string;
  eventArtistId?: string;
  artistId?: string;
  artistName?: string;
  artistGenre?: string;
  artistImageUrl?: string;
}

export interface AuditLogEntry {
  id: number;
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  entityType: string;
  entityId: string;
  userId: string | null;
  user?: { id: string; firstName?: string; lastName?: string; email?: string };
  oldValues: Record<string, unknown> | null;
  newValues: Record<string, unknown> | null;
  createdAt: string;
}

export interface AuditLogPage {
  data: AuditLogEntry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}