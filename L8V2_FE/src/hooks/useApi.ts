import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';

interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

interface UseApiReturn<T> extends UseApiState<T> {
  refetch: () => Promise<void>;
  setData: (data: T) => void;
}

// Hook for fetching data
export function useApi<T>(
  apiCall: () => Promise<{ data?: T; error?: string }>,
  dependencies: any[] = []
): UseApiReturn<T> {
  const [state, setState] = useState<UseApiState<T>>({
    data: null,
    loading: true,
    error: null,
  });

  const fetchData = useCallback(async (retryCount = 0) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await apiCall();
      
      if (result.error) {
        console.error('API Error:', result.error);
        setState({
          data: null,
          loading: false,
          error: result.error,
        });
      } else if (result.data !== undefined) {
        // Handle both null and actual data (including empty arrays)
        setState({
          data: result.data,
          loading: false,
          error: null,
        });
      } else {
        // If neither error nor data is returned, treat as error
        console.error('API returned neither data nor error');
        setState({
          data: null,
          loading: false,
          error: 'API returned an unexpected response',
        });
      }
    } catch (error) {
      console.error('API Request Failed:', error);
      
      // Retry logic for network errors
      if (retryCount < 2 && error instanceof Error && 
          (error.message.includes('fetch') || error.message.includes('network'))) {
        setTimeout(() => fetchData(retryCount + 1), 1000 * (retryCount + 1));
        return;
      }
      
      setState({
        data: null,
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred',
      });
    }
  }, [apiCall]);

  const setData = useCallback((data: T) => {
    setState(prev => ({ ...prev, data }));
  }, []);

  useEffect(() => {
    fetchData();
  }, dependencies);

  return {
    ...state,
    refetch: fetchData,
    setData,
  };
}

// Specific hooks for different data types
export function useEvents() {
  return useApi(() => apiService.getEvents());
}

export function useEvent(nameOrId: string) {
  return useApi(() => {
    // Don't make API call if name/id is invalid
    if (!nameOrId || typeof nameOrId !== 'string' || nameOrId.trim() === '') {
      return Promise.resolve({ error: 'Invalid event name or ID' });
    }
    return apiService.getEvent(nameOrId);
  }, [nameOrId]);
}

export function useArtists() {
  return useApi(() => apiService.getArtists());
}

export function useArtist(id: string) {
  return useApi(() => apiService.getArtist(id), [id]);
}

export function useVenues() {
  return useApi(() => apiService.getVenues());
}

export function useVenue(id: string) {
  return useApi(() => apiService.getVenue(id), [id]);
}

export function useGalleryImages() {
  return useApi(() => apiService.getGalleryImages());
}

export function useGalleryImage(id: string) {
  return useApi(() => apiService.getGalleryImage(id), [id]);
}


export function useEventArtists() {
  return useApi(() => apiService.getEventArtists());
}

// Hook for mutations (POST, PUT, DELETE)
export function useMutation<T, R>(
  mutationFn: (data: T) => Promise<{ data?: R; error?: string }>
) {
  const [state, setState] = useState<{
    loading: boolean;
    error: string | null;
    data: R | null;
  }>({
    loading: false,
    error: null,
    data: null,
  });

  const mutate = useCallback(async (data: T) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const result = await mutationFn(data);
      
      if (result.error) {
        setState({
          loading: false,
          error: result.error,
          data: null,
        });
        return { error: result.error };
      } else if (result.data) {
        setState({
          loading: false,
          error: null,
          data: result.data,
        });
        return { data: result.data };
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An error occurred';
      setState({
        loading: false,
        error: errorMessage,
        data: null,
      });
      return { error: errorMessage };
    }
  }, [mutationFn]);

  return {
    ...state,
    mutate,
  };
}

// Specific mutation hooks
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