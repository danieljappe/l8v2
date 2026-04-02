// API Base URL - adjust this based on your backend deployment
const API_BASE_URL = import.meta.env.VITE_API_URL || (() => {
  // Auto-detect environment
  const currentOrigin = window.location.origin;
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    return 'http://localhost:3000/api';
  }
  // Production fallback
  return 'https://l8events.dk/api';
})();

// Helper function to construct full image URLs
const constructImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) return '';
  if (imageUrl.startsWith('http')) return imageUrl;
  
  // Use environment variable for production
  if (import.meta.env.VITE_BACKEND_URL) {
    return `${import.meta.env.VITE_BACKEND_URL}${imageUrl}`;
  }
  
  // Auto-detect environment
  const currentOrigin = window.location.origin;
  if (currentOrigin.includes('localhost') || currentOrigin.includes('127.0.0.1')) {
    return imageUrl; // Relative URL for development
  }
  
  // Production fallback
  const productionBackend = import.meta.env.VITE_PRODUCTION_BACKEND_URL || 'https://l8events.dk';
  return `${productionBackend}${imageUrl}`;
};

// Common API response interface
interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
  errorData?: any; // Additional error details from backend
}

// Generic API client
class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseURL}${endpoint}`;
      
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      const baseHeaders: Record<string, string> = { 'Content-Type': 'application/json' };
      let extraHeaders: Record<string, string> = {};
      if (options.headers && typeof options.headers === 'object' && !(options.headers instanceof Headers)) {
        extraHeaders = options.headers as Record<string, string>;
      }
      if (token) {
        extraHeaders['Authorization'] = `Bearer ${token}`;
      }
      const headers = Object.assign({}, baseHeaders, extraHeaders);
      
      const response = await fetch(url, {
        headers,
        ...options,
      });

      // Handle authentication errors
      if (response.status === 401 || response.status === 403) {
        // Clear invalid token and redirect to login
        localStorage.removeItem('token');
        // Use window.location.href for hard redirect to ensure clean state
        window.location.href = '/login';
        throw new Error('Authentication failed. Please login again.');
      }

      // Handle network errors - but allow 400 responses to be processed for detailed error messages
      if (!response.ok && response.status !== 401 && response.status !== 403 && response.status !== 400) {
        console.error('API Error:', response.status, response.statusText);
        throw new Error(`Server error: ${response.status} ${response.statusText}`);
      }

      // For 400 responses, we want to extract the error message from the response body
      if (response.status === 400) {
        try {
          const errorData = await response.json();
          // Return the error details so the frontend can handle them properly
          return { error: errorData.message || errorData.details || 'Bad Request', errorData };
        } catch (parseError) {
          // If we can't parse the response, fall back to generic error
          return { error: 'Bad Request - Unable to parse error details' };
        }
      }

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      if (response.status === 204) {
        // No Content
        return { data: {} as T };
      }

      const data = await response.json();
      // Transform the response to fix image URLs
      const transformedData = transformApiResponse(data);
      return { data: transformedData };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // GET request
  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  // POST request
  async post<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // PUT request
  async put<T>(endpoint: string, data: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  // DELETE request
  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

// Create API client instance
export const apiClient = new ApiClient(API_BASE_URL);

// Helper function to transform API responses and fix image URLs
const transformApiResponse = <T>(data: T): T => {
  if (typeof data === 'object' && data !== null) {
    // Handle arrays
    if (Array.isArray(data)) {
      return data.map(item => transformApiResponse(item)) as T;
    }
    
    // Handle objects
    const transformed = { ...data } as any;
    for (const [key, value] of Object.entries(transformed)) {
      if (key === 'imageUrl' && typeof value === 'string') {
        transformed[key] = constructImageUrl(value);
      } else if (key === 'url' && typeof value === 'string') {
        transformed[key] = constructImageUrl(value);
      } else if (key === 'thumbnailUrl' && typeof value === 'string') {
        transformed[key] = constructImageUrl(value);
      } else if (key === 'mediumUrl' && typeof value === 'string') {
        transformed[key] = constructImageUrl(value);
      } else if (key === 'largeUrl' && typeof value === 'string') {
        transformed[key] = constructImageUrl(value);
      } else if (typeof value === 'object' && value !== null) {
        transformed[key] = transformApiResponse(value);
      }
    }
    return transformed;
  }
  return data;
};

// Data interfaces based on backend models
export interface Embedding {
  id: string;
  platform: 'spotify' | 'youtube' | 'soundcloud';
  embedCode: string;
  title?: string;
  description?: string;
  thumbnailUrl?: string;
  createdAt: string;
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
  embeddings?: Embedding[];
  genre?: string;
  isBookable: boolean;
  bookingUserId?: string;
  bookingUser?: User;
  createdAt: string;
  updatedAt: string;
}

export interface Venue {
  id: string;
  name: string;
  address: string;
  city?: string;
  description?: string | null;
  imageUrl?: string;
  images?: string[];
  mapEmbedHtml?: string | null;
  events?: Event[];
  createdAt: string;
  updatedAt: string;
}

export interface Event {
  id: string;
  title: string;
  description: string;
  date: string;
  startTime: string;
  endTime: string;
  ticketPrice: number;
  totalTickets: number;
  soldTickets: number;
  imageUrl?: string;
  billettoURL?: string;
  isActive: boolean;
  status: string;
  capacity?: number;
  currentAttendees: number;
  venue?: Venue;
  eventArtists: EventArtist[];
  galleryImages?: GalleryImage[];
  createdAt: string;
  updatedAt: string;
}

export interface EventArtist {
  id: string;
  event: Event;
  artist: Artist;
  performanceTime?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GalleryImage {
  id: string;
  filename: string;
  url: string;
  thumbnailUrl?: string;
  mediumUrl?: string;
  largeUrl?: string;
  caption?: string;
  eventId?: string;
  photographer?: string;
  tags?: string[];
  category: 'event' | 'venue' | 'artist' | 'other';
  orderIndex: number;
  isPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  subject?: string;
  message: string;
  isRead: boolean;
  type: 'general' | 'booking' | 'support' | 'feedback';
  status: 'pending' | 'read' | 'replied' | 'archived';
  phone?: string;
  eventDate?: string;
  artistType?: string;
  eventDetails?: string;
  budget?: number;
  adminNotes?: string;
  repliedAt?: string;
  createdAt: string;
  updatedAt: string;
}


export interface User {
  id: string;
  email: string;
  name?: string;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  imageUrl?: string;
  role?: string;
  createdAt: string;
  updatedAt: string;
}

// API service functions
export const apiService = {
  // Artists
  getArtists: () => apiClient.get<Artist[]>('/artists'),
  getArtist: (id: string) => apiClient.get<Artist>(`/artists/${id}`),
  createArtist: (artist: Partial<Artist>) => apiClient.post<Artist>('/artists', artist),
  updateArtist: (id: string, artist: Partial<Artist>) => apiClient.put<Artist>(`/artists/${id}`, artist),
  deleteArtist: (id: string) => apiClient.delete<null>(`/artists/${id}`),

  // Embeddings
  addEmbedding: (artistId: string, embedCode: string) => apiClient.post<Embedding>(`/artists/${artistId}/embeddings`, { embedCode }),
  updateEmbedding: (artistId: string, embeddingId: string, embedCode: string) => apiClient.put<Embedding>(`/artists/${artistId}/embeddings/${embeddingId}`, { embedCode }),
  deleteEmbedding: (artistId: string, embeddingId: string) => apiClient.delete<null>(`/artists/${artistId}/embeddings/${embeddingId}`),

  // Events
  getEvents: () => apiClient.get<Event[]>('/events'),
  getEvent: (nameOrId: string) => apiClient.get<Event>(`/events/${nameOrId}`),
  createEvent: (event: Partial<Event>) => apiClient.post<Event>('/events', event),
  updateEvent: (id: string, event: Partial<Event>) => apiClient.put<Event>(`/events/${id}`, event),
  deleteEvent: (id: string) => apiClient.delete<null>(`/events/${id}`),

  // Venues
  getVenues: () => apiClient.get<Venue[]>('/venues'),
  getVenue: (id: string) => apiClient.get<Venue>(`/venues/${id}`),
  createVenue: (venue: Partial<Venue>) => apiClient.post<Venue>('/venues', venue),
  updateVenue: (id: string, venue: Partial<Venue>) => apiClient.put<Venue>(`/venues/${id}`, venue),
  deleteVenue: (id: string) => apiClient.delete<null>(`/venues/${id}`),

  // Gallery
  getGalleryImages: () => {
    const result = apiClient.get<GalleryImage[]>('/gallery');
    return result;
  },
  getGalleryImage: (id: string) => apiClient.get<GalleryImage>(`/gallery/${id}`),
  createGalleryImage: (image: Partial<GalleryImage>) => apiClient.post<GalleryImage>('/gallery', image),
  updateGalleryImage: (id: string, image: Partial<GalleryImage>) => apiClient.put<GalleryImage>(`/gallery/${id}`, image),
  deleteGalleryImage: (id: string) => apiClient.delete<null>(`/gallery/${id}`),

  // Contact
  getContactMessages: () => apiClient.get<ContactMessage[]>('/contact'),
  getContactMessage: (id: string) => apiClient.get<ContactMessage>(`/contact/${id}`),
  createContactMessage: (message: Partial<ContactMessage>) => apiClient.post<ContactMessage>('/contact', message),
  updateContactMessage: (id: string, message: Partial<ContactMessage>) => apiClient.put<ContactMessage>(`/contact/${id}`, message),
  deleteContactMessage: (id: string) => apiClient.delete<null>(`/contact/${id}`),

  // Users
  getUsers: () => apiClient.get<User[]>('/users'),
  getUser: (id: string) => apiClient.get<User>(`/users/${id}`),
  updateUser: (id: string, user: Partial<User>) => apiClient.put<User>(`/users/${id}`, user),
  changePassword: (id: string, payload: { currentPassword: string; newPassword: string }) =>
    apiClient.put<{ message: string }>(`/users/${id}/password`, payload),
  createUser: (user: { firstName: string; lastName: string; email: string; password: string }) =>
    apiClient.post<User>('/users', user),
  deleteUser: (id: string) => apiClient.delete<{ message: string }>(`/users/${id}`),


  // Event Artists
  getEventArtists: () => apiClient.get<EventArtist[]>('/event-artists'),
  createEventArtist: (eventArtist: Partial<EventArtist>) => apiClient.post<EventArtist>('/event-artists', eventArtist),
  removeArtistFromEvent: (eventId: string, artistId: string) => apiClient.delete<{ message: string; removedArtist: string; eventTitle: string }>(`/event-artists/event/${eventId}/artist/${artistId}`),

  // Gallery image upload
  uploadGalleryImage: async (file: File, metadata?: {
    title?: string;
    description?: string;
    category?: string;
    tags?: string[];
    uploadedBy?: string;
    eventId?: string;
  }) => {
    const formData = new FormData();
    formData.append('image', file);
    
    if (metadata) {
      if (metadata.title) formData.append('title', metadata.title);
      if (metadata.description) formData.append('description', metadata.description);
      if (metadata.category) formData.append('category', metadata.category);
      if (metadata.tags) formData.append('tags', JSON.stringify(metadata.tags));
      if (metadata.uploadedBy) formData.append('uploadedBy', metadata.uploadedBy);
      if (metadata.eventId) formData.append('eventId', metadata.eventId);
    }
    
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch(`${API_BASE_URL}/gallery/upload`, {
      method: 'POST',
      body: formData,
      headers,
    });
    if (!response.ok) {
      throw new Error('Image upload failed');
    }
    return response.json();
  },

  // Artist image upload
  uploadArtistImage: async (file: File) => {
    const formData = new FormData();
    formData.append('image', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
    const headers: Record<string, string> = token ? { 'Authorization': `Bearer ${token}` } : {};
    const response = await fetch(`${API_BASE_URL}/artists/upload-image`, {
      method: 'POST',
      body: formData,
      headers,
    });
    if (!response.ok) {
      throw new Error('Artist image upload failed');
    }
    return response.json();
  },
};

export default apiService; 