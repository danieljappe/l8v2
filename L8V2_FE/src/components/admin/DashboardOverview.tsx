import React, { useMemo } from 'react';
import { Calendar, Users, MapPin, Image, MessageSquare } from 'lucide-react';
import { Event, Artist, Venue, GalleryItem, Message } from '../../types/admin';

interface DashboardOverviewProps {
  events: Event[];
  artists: Artist[];
  venues: Venue[];
  gallery: GalleryItem[];
  messages: Message[];
}

const RECENT_ITEMS_LIMIT = 5;

interface StatCard {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}

export default function DashboardOverview({
  events,
  artists,
  venues,
  gallery,
  messages
}: DashboardOverviewProps) {
  const unreadMessages = useMemo(
    () => messages.filter(message => !message.read).length,
    [messages]
  );

  const stats: StatCard[] = useMemo(() => [
    {
      title: 'Total Events',
      value: events.length,
      icon: Calendar,
      color: 'bg-blue-500'
    },
    {
      title: 'Active Artists',
      value: artists.length,
      icon: Users,
      color: 'bg-green-500'
    },
    {
      title: 'Venues',
      value: venues.length,
      icon: MapPin,
      color: 'bg-l8-blue'
    },
    {
      title: 'Gallery Items',
      value: gallery.length,
      icon: Image,
      color: 'bg-orange-500'
    },
    {
      title: 'Unread Messages',
      value: unreadMessages,
      icon: MessageSquare,
      color: 'bg-red-500'
    }
  ], [events.length, artists.length, venues.length, gallery.length, unreadMessages]);

  const recentEvents = useMemo(() => {
    return [...events]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, RECENT_ITEMS_LIMIT);
  }, [events]);

  const recentMessages = useMemo(() => {
    return [...messages]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, RECENT_ITEMS_LIMIT);
  }, [messages]);

  const getStatusBadgeClass = (status: Event['status']) => {
    switch (status) {
      case 'upcoming':
        return 'bg-green-100 text-green-800';
      case 'completed':
        return 'bg-gray-100 text-gray-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Dashboard Overview</h1>
        <p className="text-gray-600">Welcome back! Here's what's happening with your events.</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={stat.title} className="bg-white rounded-lg shadow p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                </div>
                <div className={`${stat.color} p-3 rounded-lg`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Events */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Events</h3>
          </div>
          <div className="p-6">
            {recentEvents.length > 0 ? (
              <div className="space-y-4">
                {recentEvents.map((event) => (
                  <div key={event.id} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Calendar className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{event.title}</p>
                      <p className="text-sm text-gray-500">
                        {event.date} {event.time && `at ${event.time}`}
                      </p>
                    </div>
                    <span className={`px-2 py-1 text-xs font-medium rounded-full capitalize flex-shrink-0 ${getStatusBadgeClass(event.status)}`}>
                      {event.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No events yet</p>
            )}
          </div>
        </div>

        {/* Recent Messages */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Recent Messages</h3>
          </div>
          <div className="p-6">
            {recentMessages.length > 0 ? (
              <div className="space-y-4">
                {recentMessages.map((message) => (
                  <div key={message.id} className="flex items-center space-x-4">
                    <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-sm font-medium text-gray-700">
                        {message.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 truncate">{message.subject}</p>
                      <p className="text-sm text-gray-500 truncate">
                        {message.name} • {message.email}
                      </p>
                    </div>
                    {!message.read && (
                      <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0" aria-label="Unread message" />
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 text-center py-4">No messages yet</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 