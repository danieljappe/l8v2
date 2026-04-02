import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Event, Artist, Venue } from '../../types/admin';
import Select from 'react-select';

interface EventFormProps {
  event?: Event | null;
  onSubmit: (eventData: Omit<Event, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  artists: Artist[];
  venues: Venue[];
  onRemoveArtist?: (eventId: string, artistId: string) => void;
  onAddArtistToEvent?: (eventId: string, artistId: string) => void;
}

export default function EventForm({ event, onSubmit, onCancel, artists, venues, onRemoveArtist, onAddArtistToEvent }: EventFormProps) {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    date: '',
    time: '',
    endTime: '',
    venue: '',
    artists: [] as string[],
    price: 0,
    capacity: 0,
    image: '',
    billettoURL: '',
    status: 'upcoming' as Event['status']
  });

  useEffect(() => {
    if (event) {
      setFormData({
        title: event.title,
        description: event.description,
        date: event.date,
        time: event.time,
        endTime: event.endTime || '',
        artists: event.artists || [],
        venue: event.venue || '',
        price: event.price,
        capacity: event.capacity,
        image: event.image,
        billettoURL: event.billettoURL || '',
        status: event.status
      });
    }
  }, [event]);

  // Additional effect to refresh when event.eventArtists changes
  useEffect(() => {
    // Event artists are updated through props
  }, [event?.eventArtists]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      artist: formData.artists.join(','),
      venue: formData.venue,
      imageUrl: formData.image,
      billettoURL: formData.billettoURL
    });
  };

  const handleAddSelectedArtists = () => {
    if (formData.artists.length > 0 && event && onAddArtistToEvent) {
      // Filter out artists that are already in the event
      const existingArtistIds = event.eventArtists?.map(ea => ea.artist.id) || [];
      const newArtistIds = formData.artists.filter(artistId => !existingArtistIds.includes(artistId));
      
      if (newArtistIds.length === 0) {
        alert('All selected artists are already in this event');
        setFormData(prev => ({ ...prev, artists: [] }));
        return;
      }
      
      if (newArtistIds.length < formData.artists.length) {
        const duplicateCount = formData.artists.length - newArtistIds.length;
        alert(`${duplicateCount} artist(s) were already in this event and were skipped`);
      }
      
      // Optimistically update the local event state with only new artists
      const selectedArtists = artists.filter(a => newArtistIds.includes(a.id));
      
      // Create optimistic eventArtists entries
      const optimisticEventArtists = selectedArtists.map(artist => ({
        id: `temp-${Date.now()}-${artist.id}`, // Temporary ID
        artist: {
          id: artist.id,
          name: artist.name
        }
      }));
      
      // Update the local event state immediately
      if (event.eventArtists) {
        event.eventArtists.push(...optimisticEventArtists);
      } else {
        event.eventArtists = optimisticEventArtists;
      }
      
      // Force a re-render by updating the form state
      setFormData(prev => ({ ...prev }));
      
      // Clear the selected artists
      setFormData(prev => ({ ...prev, artists: [] }));
      
      // Add each new artist to the backend
      newArtistIds.forEach(artistId => {
        onAddArtistToEvent(event.id, artistId);
      });
    }
  };

  const handleRemoveArtist = (eventId: string, artistId: string) => {
    if (event && event.eventArtists && onRemoveArtist) {
      // Optimistically remove from local state
      const artistIndex = event.eventArtists.findIndex(ea => ea.artist.id === artistId);
      if (artistIndex !== -1) {
        event.eventArtists.splice(artistIndex, 1);
        // Force re-render
        setFormData(prev => ({ ...prev }));
      }
      
      // Call backend to actually remove
      onRemoveArtist(eventId, artistId);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'price' || name === 'capacity' ? Number(value) : value
    }));
  };

  const artistOptions = artists.map(artist => ({ value: artist.id, label: artist.name }));
  const venueOptions = venues.map(venue => ({ value: venue.id, label: venue.name }));

  // Get available artists (not already in the event)
  const availableArtists = artistOptions.filter(option => {
    if (!event?.eventArtists) return true;
    return !event.eventArtists.some(ea => ea.artist.id === option.value);
  });

  // Get current artists count
  const currentArtistsCount = event?.eventArtists?.length || 0;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">
              {event ? 'Edit Event' : 'Add New Event'}
            </h2>
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Event Title
              </label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Artists
              </label>
              <Select
                isMulti
                options={availableArtists}
                value={artistOptions.filter(option => formData.artists.includes(option.value))}
                onChange={(selected) => setFormData(prev => ({ ...prev, artists: selected ? selected.map((s: any) => s.value) : [] }))}
                classNamePrefix="react-select"
                placeholder="Select artists..."
                isClearable
                noOptionsMessage={() => 
                  currentArtistsCount === 0 
                    ? "No artists available" 
                    : "All available artists are already in this event"
                }
              />
              
              {/* Add selected artists button */}
              {event && formData.artists.length > 0 && onAddArtistToEvent && (
                <div className="mt-2">
                  <button
                    type="button"
                    onClick={handleAddSelectedArtists}
                    className="w-full px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm"
                  >
                    Add Selected Artists to Event
                  </button>
                </div>
              )}
              
              {/* Display current artists with remove buttons */}
              {event && onRemoveArtist && (
                <div className="mt-3">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Current Artists ({currentArtistsCount})
                  </label>
                  {event.eventArtists && event.eventArtists.length > 0 ? (
                    <div className="space-y-2">
                      {event.eventArtists.map((eventArtist) => {
                        const artist = artists.find(a => a.id === eventArtist.artist.id);
                        return (
                          <div key={eventArtist.id} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded-lg">
                            <span className="text-sm text-gray-700">{artist?.name || 'Unknown Artist'}</span>
                            <button
                              type="button"
                              onClick={() => handleRemoveArtist(event.id, eventArtist.artist.id)}
                              className="text-red-600 hover:text-red-800 text-sm px-2 py-1 rounded hover:bg-red-50"
                            >
                              Remove
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 bg-gray-50 px-3 py-2 rounded-lg">
                      No artists assigned to this event yet. Use the dropdown above to add artists.
                    </div>
                  )}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Date
              </label>
              <input
                type="date"
                name="date"
                value={formData.date}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Time
              </label>
              <input
                type="time"
                name="time"
                value={formData.time}
                onChange={handleChange}
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                End Time (Optional)
              </label>
              <input
                type="time"
                name="endTime"
                value={formData.endTime || ''}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Venue
              </label>
              <Select
                name="venue"
                options={venueOptions}
                value={venueOptions.find(option => option.value === formData.venue) || null}
                onChange={(selected) => setFormData(prev => ({ ...prev, venue: selected ? (selected as any).value : '' }))}
                classNamePrefix="react-select"
                placeholder="Select venue..."
                isClearable
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Capacity
              </label>
              <input
                type="number"
                name="capacity"
                value={formData.capacity}
                onChange={handleChange}
                required
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Price ($)
              </label>
              <input
                type="number"
                name="price"
                value={formData.price}
                onChange={handleChange}
                required
                min="0"
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Status
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="upcoming">Upcoming</option>
                <option value="ongoing">Ongoing</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              required
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Image URL
            </label>
            <input
              type="url"
              name="image"
              value={formData.image}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Billetto URL
            </label>
            <input
              type="url"
              name="billettoURL"
              value={formData.billettoURL}
              onChange={handleChange}
              placeholder="https://billetto.dk/events/..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {event ? 'Update Event' : 'Create Event'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 