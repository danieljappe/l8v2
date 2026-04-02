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
  eventArtists?: Array<{
    id: string;
    artist: {
      id: string;
      name: string;
    };
  }>;
  // Add backend-compatible fields
  ticketPrice?: number;
  totalTickets?: number;
  soldTickets?: number;
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
  socialMedia?: Array<{
    platform: string;
    url: string;
  }>;
  embeddings?: Array<{
    id: string;
    platform: 'spotify' | 'youtube' | 'soundcloud';
    embedCode: string;
    title?: string;
    description?: string;
    thumbnailUrl?: string;
    createdAt: string;
  }>;
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
  createdAt: string;
}

export type AdminSection = 'dashboard' | 'events' | 'artists' | 'venues' | 'gallery' | 'messages' | 'account';