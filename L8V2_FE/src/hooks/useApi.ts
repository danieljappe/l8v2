import { useQuery, useMutation as useTanstackMutation } from '@tanstack/react-query';
import { apiService, type GalleryImage } from '../services/api';

// ─── Query key factory ────────────────────────────────────────────────────────
// Centralised so cache invalidation is consistent across the app.
export const queryKeys = {
  events:              ['events']                                         as const,
  eventsUpcoming:      (limit?: number) => ['events', 'upcoming', limit] as const,
  eventsPast:          (limit?: number) => ['events', 'past', limit]     as const,
  event:               (id: string)     => ['events', id]                as const,
  artists:             ['artists']                                        as const,
  artistsBookable:     ['artists', 'bookable']                           as const,
  artist:              (id: string)     => ['artists', id]               as const,
  venues:              ['venues']                                         as const,
  venue:               (id: string)     => ['venues', id]                as const,
  gallery:             ['gallery']                                        as const,
  galleryByEvent:      (eventId: string, limit?: number) => ['gallery', 'byEvent', eventId, limit] as const,
  galleryImage:        (id: string)     => ['gallery', id]               as const,
  contactMessages:     ['contact']                                        as const,
  eventArtists:        ['event-artists']                                  as const,
};

// ─── Shared adapter ───────────────────────────────────────────────────────────
// Maps TanStack Query's shape to the { data, loading, error } the app uses.
function adapt<T>(query: ReturnType<typeof useQuery<T>>) {
  return {
    data:    query.data ?? null,
    loading: query.isPending,
    error:   query.error ? query.error.message : null,
    refetch: query.refetch,
  };
}

// ─── Event hooks ──────────────────────────────────────────────────────────────

export function useEvents() {
  return adapt(useQuery({
    queryKey: queryKeys.events,
    queryFn:  () => apiService.getEvents().then(r => r.data ?? []),
  }));
}

export function useUpcomingEvents(limit?: number) {
  return adapt(useQuery({
    queryKey: queryKeys.eventsUpcoming(limit),
    queryFn:  () => apiService.getUpcomingEvents(limit).then(r => r.data ?? []),
  }));
}

export function usePastEvents(limit?: number) {
  return adapt(useQuery({
    queryKey: queryKeys.eventsPast(limit),
    queryFn:  () => apiService.getPastEvents(limit).then(r => r.data ?? []),
  }));
}

export function useEvent(nameOrId: string) {
  return adapt(useQuery({
    queryKey: queryKeys.event(nameOrId),
    queryFn:  () => apiService.getEvent(nameOrId).then(r => r.data ?? null),
    enabled:  Boolean(nameOrId?.trim()),
  }));
}

// ─── Artist hooks ─────────────────────────────────────────────────────────────

export function useArtists(options?: { enabled?: boolean }) {
  return adapt(useQuery({
    queryKey: queryKeys.artists,
    queryFn:  () => apiService.getArtists().then(r => r.data ?? []),
    enabled:  options?.enabled ?? true,
  }));
}

export function useBookableArtists() {
  return adapt(useQuery({
    queryKey: queryKeys.artistsBookable,
    queryFn:  () => apiService.getBookableArtists().then(r => r.data ?? []),
  }));
}

export function useArtist(id: string) {
  return adapt(useQuery({
    queryKey: queryKeys.artist(id),
    queryFn:  () => apiService.getArtist(id).then(r => r.data ?? null),
    enabled:  Boolean(id),
  }));
}

// ─── Venue hooks ──────────────────────────────────────────────────────────────

export function useVenues() {
  return adapt(useQuery({
    queryKey: queryKeys.venues,
    queryFn:  () => apiService.getVenues().then(r => r.data ?? []),
  }));
}

export function useVenue(id: string) {
  return adapt(useQuery({
    queryKey: queryKeys.venue(id),
    queryFn:  () => apiService.getVenue(id).then(r => r.data ?? null),
    enabled:  Boolean(id),
  }));
}

// ─── Gallery hooks ────────────────────────────────────────────────────────────

export function useGalleryImages() {
  return adapt(useQuery({
    queryKey: queryKeys.gallery,
    queryFn:  () => apiService.getGalleryImages().then(r => r.data ?? []),
  }));
}

// Dependent query — only fires when eventId is known.
// TanStack Query's `enabled` flag is cleaner than a Promise.resolve([]) workaround.
export function useGalleryImagesByEvent(eventId: string | undefined, limit?: number) {
  const query = useQuery<GalleryImage[]>({
    queryKey: queryKeys.galleryByEvent(eventId!, limit),
    queryFn:  () => apiService.getGalleryImagesByEvent(eventId!, limit).then(r => r.data ?? []),
    enabled:  Boolean(eventId),
  });
  return adapt(query);
}

export function useGalleryImage(id: string) {
  return adapt(useQuery({
    queryKey: queryKeys.galleryImage(id),
    queryFn:  () => apiService.getGalleryImage(id).then(r => r.data ?? null),
    enabled:  Boolean(id),
  }));
}

// ─── Stats hook ───────────────────────────────────────────────────────────────

export function useStats() {
  return adapt(useQuery({
    queryKey: ['stats'],
    queryFn:  () => apiService.getStats().then(r => r.data ?? null),
    staleTime: 30 * 60 * 1000, // stats rarely change — cache for 30 minutes
  }));
}

// ─── User hooks ───────────────────────────────────────────────────────────────

export function useUsers() {
  return adapt(useQuery({
    queryKey: ['users'],
    queryFn:  () => apiService.getUsers().then(r => r.data ?? []),
  }));
}

// ─── Other hooks ──────────────────────────────────────────────────────────────

export function useEventArtists() {
  return adapt(useQuery({
    queryKey: queryKeys.eventArtists,
    queryFn:  () => apiService.getEventArtists().then(r => r.data ?? []),
  }));
}

// ─── Mutation hook ────────────────────────────────────────────────────────────
// Kept separate — mutations are not cached and don't need query keys.

export function useMutation<T, R>(
  mutationFn: (data: T) => Promise<{ data?: R; error?: string }>
) {
  const mutation = useTanstackMutation({
    mutationFn: async (data: T) => {
      const result = await mutationFn(data);
      if (result.error) throw new Error(result.error);
      return result.data as R;
    }
  });

  return {
    loading: mutation.isPending,
    error:   mutation.error ? mutation.error.message : null,
    data:    mutation.data ?? null,
    mutate:  async (data: T) => {
      try {
        const result = await mutation.mutateAsync(data);
        return { data: result };
      } catch (err) {
        return { error: (err as Error).message };
      }
    }
  };
}

// ─── Specific mutation hooks ──────────────────────────────────────────────────

export function useCreateContactMessage() {
  return useMutation(apiService.createContactMessage);
}

export function useCreateEvent() {
  return useMutation(apiService.createEvent);
}

export function useCreateArtist() {
  return useMutation(apiService.createArtist);
}

export function useCreateVenue() {
  return useMutation(apiService.createVenue);
}

export function useCreateGalleryImage() {
  return useMutation(apiService.createGalleryImage);
}

export function useCreateEventArtist() {
  return useMutation(apiService.createEventArtist);
}
