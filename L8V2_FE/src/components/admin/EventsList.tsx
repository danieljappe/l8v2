import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Calendar, MapPin, Users, DollarSign } from 'lucide-react';
import { Event } from '../../types/admin';
import EventForm from './EventForm';
import { Artist, Venue } from '../../types/admin';

interface EventsListProps {
  events: Event[];
  onAddEvent: (eventData: Omit<Event, 'id' | 'createdAt'>) => void;
  onUpdateEvent: (event: Event) => void;
  onDeleteEvent: (id: string) => void;
  artists: Artist[];
  venues: Venue[];
  onRemoveArtist?: (eventId: string, artistId: string) => void;
  onAddArtistToEvent?: (eventId: string, artistId: string) => void;
}

export default function EventsList({
  events,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  artists,
  venues,
  onRemoveArtist,
  onAddArtistToEvent
}: EventsListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);

  // Refresh editingEvent when events change (e.g., after adding/removing artists)
  useEffect(() => {
    if (editingEvent) {
      const updatedEvent = events.find(e => e.id === editingEvent.id);
      if (updatedEvent) {
        setEditingEvent(updatedEvent);
      }
    }
  }, [events, editingEvent?.id]);

  const handleEdit = (event: Event) => {
    setEditingEvent(event);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      onDeleteEvent(id);
    }
  };

  const handleFormSubmit = (eventData: Omit<Event, 'id' | 'createdAt'>) => {
    if (editingEvent) {
      onUpdateEvent({ ...editingEvent, ...eventData });
      setEditingEvent(null);
    } else {
      onAddEvent(eventData);
    }
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingEvent(null);
  };

  const getStatusColor = (status: Event['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-green-100 text-green-800';
      case 'ongoing':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Events Management</h1>
          <p className="text-gray-600">Manage all your events and performances.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Event</span>
        </button>
      </div>

      {showForm && (
        <EventForm
          event={editingEvent}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          artists={artists}
          venues={venues}
          onRemoveArtist={onRemoveArtist}
          onAddArtistToEvent={onAddArtistToEvent}
        />
      )}

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Event
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date & Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Venue
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Capacity
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Price
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {events.map((event) => {
                const venueObj = venues.find(v => v.id === event.venue);
                return (
                  <tr key={event.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <Calendar className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {event.title}
                            {event.billettoURL && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                Tickets
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-500">{event.artist}</div>
                          
                          {/* Show current artists with remove buttons */}
                          {event.eventArtists && event.eventArtists.length > 0 && (
                            <div className="mt-2 space-y-1">
                              {event.eventArtists.map((eventArtist) => {
                                const artist = artists.find(a => a.id === eventArtist.artist.id);
                                return (
                                  <div key={eventArtist.id} className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded text-xs">
                                    <span className="text-gray-600">{artist?.name || 'Unknown Artist'}</span>
                                    {onRemoveArtist && (
                                      <button
                                        onClick={() => onRemoveArtist(event.id, eventArtist.artist.id)}
                                        className="text-red-500 hover:text-red-700 ml-2"
                                        title="Remove artist from event"
                                      >
                                        ×
                                      </button>
                                    )}
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{event.date}</div>
                      <div className="text-sm text-gray-500">{event.time}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <MapPin className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{venueObj ? venueObj.name : event.venue}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Users className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{event.capacity}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <DollarSign className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">${event.price}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(event.status)}`}>
                        {event.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleEdit(event)}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(event.id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
} 