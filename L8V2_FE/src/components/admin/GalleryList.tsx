import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Tag, User, Calendar, MapPin, Clock, Copy, Check } from 'lucide-react';
import { GalleryItem } from '../../types/admin';
import { apiService, Event } from '../../services/api';

interface GalleryListProps {
  gallery: GalleryItem[];
  onAddGallery: (galleryData: Omit<GalleryItem, 'id' | 'createdAt'>) => void;
  onUpdateGallery: (item: GalleryItem) => void;
  onDeleteGallery: (id: string) => void;
}

export default function GalleryList({
  gallery,
  onAddGallery,
  onUpdateGallery,
  onDeleteGallery
}: GalleryListProps) {
  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);
  const [events, setEvents] = useState<Event[]>([]);
  const [loadingEvents, setLoadingEvents] = useState(false);
  const [eventMap, setEventMap] = useState<Record<string, Event>>({});
  const [copiedUrl, setCopiedUrl] = useState<string | null>(null);

  // Fetch events for dropdown and create event map
  useEffect(() => {
    const fetchEvents = async () => {
      setLoadingEvents(true);
      try {
        const response = await apiService.getEvents();
        if (response.data) {
          setEvents(response.data);
          // Create event map for quick lookup
          const map: Record<string, Event> = {};
          response.data.forEach(event => {
            map[event.id] = event;
          });
          setEventMap(map);
        }
      } catch (error) {
        console.error('Failed to fetch events:', error);
      } finally {
        setLoadingEvents(false);
      }
    };
    fetchEvents();
  }, []);

  const handleEdit = (item: GalleryItem) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this gallery item?')) {
      onDeleteGallery(id);
    }
  };

  const handleFormSubmit = (galleryData: Omit<GalleryItem, 'id' | 'createdAt'>) => {
    if (editingItem) {
      onUpdateGallery({ ...editingItem, ...galleryData });
      setEditingItem(null);
    } else {
      onAddGallery(galleryData);
    }
    setShowForm(false);
  };

  const handleCancel = () => {
    setShowForm(false);
    setEditingItem(null);
  };

  const handleCopyUrl = async (url: string) => {
    try {
      // Construct full URL if it's a relative path
      const fullUrl = url.startsWith('http') ? url : `${window.location.origin}${url}`;
      await navigator.clipboard.writeText(fullUrl);
      setCopiedUrl(url);
      // Reset the copied state after 2 seconds
      setTimeout(() => setCopiedUrl(null), 2000);
    } catch (error) {
      console.error('Failed to copy URL:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = url.startsWith('http') ? url : `${window.location.origin}${url}`;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedUrl(url);
      setTimeout(() => setCopiedUrl(null), 2000);
    }
  };

  const getCategoryColor = (category: GalleryItem['category']) => {
    switch (category) {
      case 'event':
        return 'bg-blue-100 text-blue-800';
      case 'artist':
        return 'bg-green-100 text-green-800';
      case 'venue':
        return 'bg-l8-beige/20 text-l8-beige-dark';
      case 'other':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gallery Management</h1>
          <p className="text-gray-600">Manage all your gallery images and content.</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Item</span>
        </button>
      </div>

      {showForm && (
        <GalleryForm
          item={editingItem}
          onSubmit={handleFormSubmit}
          onCancel={handleCancel}
          onAddGallery={onAddGallery}
          events={events}
          loadingEvents={loadingEvents}
        />
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {gallery.map((item) => {
          const linkedEvent = item.eventId ? eventMap[item.eventId] : null;
          return (
            <div key={item.id} className="bg-white rounded-lg shadow overflow-hidden hover:shadow-lg transition-shadow">
                      <div className="aspect-w-16 aspect-h-9 bg-gray-200 relative group">
                        {item.url && (
                          <img
                            src={item.url}
                            alt={item.caption || item.filename}
                            className="w-full h-48 object-cover"
                          />
                        )}
                        {linkedEvent && (
                          <div className="absolute top-2 left-2">
                            <span className="bg-blue-600 text-white px-2 py-1 text-xs font-medium rounded-full flex items-center">
                              <Calendar className="w-3 h-3 mr-1" />
                              Event
                            </span>
                          </div>
                        )}
                        <div className="absolute top-2 right-2">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${getCategoryColor(item.category)}`}>
                            {item.category}
                          </span>
                        </div>
                        
                        {/* Copy URL Button */}
                        <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyUrl(item.url);
                            }}
                            className={`p-2 rounded-full shadow-lg transition-colors ${
                              copiedUrl === item.url 
                                ? 'bg-green-500 text-white' 
                                : 'bg-black/70 text-white hover:bg-black/90'
                            }`}
                            title={copiedUrl === item.url ? 'URL copied!' : 'Copy image URL'}
                          >
                            {copiedUrl === item.url ? (
                              <Check className="w-4 h-4" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                        </div>
                      </div>
              <div className="p-6">
                <div className="mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 line-clamp-1">
                    {item.caption || item.filename}
                  </h3>
                  {linkedEvent && (
                    <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                      <div className="flex items-center text-sm font-medium text-blue-900 mb-1">
                        <Calendar className="w-4 h-4 mr-2" />
                        {linkedEvent.title}
                      </div>
                      <div className="flex items-center text-xs text-blue-700">
                        <Clock className="w-3 h-3 mr-1" />
                        {new Date(linkedEvent.date).toLocaleDateString()} at {linkedEvent.startTime}
                      </div>
                      {linkedEvent.venue && (
                        <div className="flex items-center text-xs text-blue-700 mt-1">
                          <MapPin className="w-3 h-3 mr-1" />
                          {linkedEvent.venue.name}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                
                <div className="space-y-2 mb-4">
                  {item.photographer && (
                    <div className="flex items-center text-sm text-gray-500">
                      <User className="w-4 h-4 mr-2" />
                      <span className="truncate">{item.photographer}</span>
                    </div>
                  )}
                  {item.tags && item.tags.length > 0 && (
                    <div className="flex items-center text-sm text-gray-500">
                      <Tag className="w-4 h-4 mr-2 flex-shrink-0" />
                      <span className="truncate">{(item.tags || []).join(', ')}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>Order: {item.orderIndex}</span>
                    <span className={`px-2 py-1 rounded-full ${item.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {item.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button
                    onClick={() => handleEdit(item)}
                    className="text-blue-600 hover:text-blue-900 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                    title="Edit image"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.id)}
                    className="text-red-600 hover:text-red-900 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Delete image"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Simple GalleryForm component
function GalleryForm({ item, onSubmit, onCancel, onAddGallery, events, loadingEvents }: {
  item?: GalleryItem | null;
  onSubmit: (galleryData: Omit<GalleryItem, 'id' | 'createdAt'>) => void;
  onCancel: () => void;
  onAddGallery: (galleryData: Omit<GalleryItem, 'id' | 'createdAt'>) => void;
  events: Event[];
  loadingEvents: boolean;
}) {
  const [formData, setFormData] = useState({
    filename: item?.filename || '',
    url: item?.url || '',
    thumbnailUrl: item?.thumbnailUrl || '',
    mediumUrl: item?.mediumUrl || '',
    largeUrl: item?.largeUrl || '',
    caption: item?.caption || '',
    eventId: item?.eventId || '',
    photographer: item?.photographer || '',
    tags: item?.tags || [],
    category: item?.category || 'event' as GalleryItem['category'],
    orderIndex: item?.orderIndex || 0,
    isPublished: item?.isPublished || false,
  });
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Update form data when item changes
  useEffect(() => {
    if (item) {
      setFormData({
        filename: item.filename || '',
        url: item.url || '',
        thumbnailUrl: item.thumbnailUrl || '',
        mediumUrl: item.mediumUrl || '',
        largeUrl: item.largeUrl || '',
        caption: item.caption || '',
        eventId: item.eventId || '',
        photographer: item.photographer || '',
        tags: item.tags || [],
        category: item.category || 'event',
        orderIndex: item.orderIndex || 0,
        isPublished: item.isPublished || false,
      });
    }
  }, [item]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError(null);
      // Update form data with file name as default caption
      setFormData(prev => ({
        ...prev,
        caption: prev.caption || file.name,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!item && selectedFile) {
      // For new items with file upload, upload the file and create the record
      setUploading(true);
      setUploadError(null);
      try {
        const result = await apiService.uploadGalleryImage(selectedFile, {
          title: formData.caption || selectedFile.name,
          description: formData.caption || selectedFile.name,
          category: formData.category,
          tags: formData.tags,
          uploadedBy: formData.photographer || 'Admin',
          eventId: formData.eventId || undefined,
        });
        
        // Create the gallery item with uploaded data
        const newGalleryItem = {
          filename: result.galleryImage.filename,
          url: result.galleryImage.url,
          thumbnailUrl: result.galleryImage.thumbnailUrl,
          mediumUrl: result.galleryImage.mediumUrl,
          largeUrl: result.galleryImage.largeUrl,
          caption: result.galleryImage.caption,
          eventId: result.galleryImage.eventId,
          photographer: result.galleryImage.photographer,
          tags: result.galleryImage.tags,
          category: result.galleryImage.category,
          orderIndex: result.galleryImage.orderIndex,
          isPublished: result.galleryImage.isPublished,
          id: result.galleryImage.id,
          createdAt: result.galleryImage.createdAt,
          updatedAt: result.galleryImage.updatedAt || result.galleryImage.createdAt,
        };
        
        onAddGallery(newGalleryItem);
        onCancel(); // Close the form since the item is now added
      } catch (err: any) {
        setUploadError(err.message || 'Upload failed');
      } finally {
        setUploading(false);
      }
    } else if (item) {
      // For editing existing items, update the record
      onSubmit({ ...formData, updatedAt: new Date().toISOString() });
    } else {
      // For new items without file upload, create a new record
      onSubmit({ ...formData, updatedAt: new Date().toISOString() });
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {item ? 'Edit Gallery Item' : 'Add New Gallery Item'}
          </h2>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="gallery-filename" className="block text-sm font-medium text-gray-700 mb-1">Filename</label>
              <input
                id="gallery-filename"
                type="text"
                placeholder="Filename"
                value={formData.filename}
                onChange={(e) => setFormData({...formData, filename: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                required
              />
            </div>
            <div>
              <label htmlFor="gallery-category" className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                id="gallery-category"
                value={formData.category}
                onChange={(e) => setFormData({...formData, category: e.target.value as GalleryItem['category']})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              >
                <option value="event">Event</option>
                <option value="artist">Artist</option>
                <option value="venue">Venue</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
          
          <div>
            <label htmlFor="gallery-event" className="block text-sm font-medium text-gray-700 mb-1">Event (Optional)</label>
            <select
              id="gallery-event"
              value={formData.eventId}
              onChange={(e) => setFormData({...formData, eventId: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            >
              <option value="">No event selected</option>
              {loadingEvents ? (
                <option disabled>Loading events...</option>
              ) : (
                events.map((event) => (
                  <option key={event.id} value={event.id}>
                    {event.title} - {new Date(event.date).toLocaleDateString()}
                  </option>
                ))
              )}
            </select>
          </div>
          
          <div>
            <label htmlFor="gallery-caption" className="block text-sm font-medium text-gray-700 mb-1">Caption</label>
            <input
              id="gallery-caption"
              type="text"
              placeholder="Caption"
              value={formData.caption}
              onChange={(e) => setFormData({...formData, caption: e.target.value})}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
          </div>
          
          <div>
            <label htmlFor="gallery-image" className="block text-sm font-medium text-gray-700 mb-1">Image Upload</label>
            <input
              id="gallery-image"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg"
            />
            {selectedFile && (
              <p className="text-xs text-green-600 mt-1">Selected: {selectedFile.name}</p>
            )}
            {uploading && <p className="text-xs text-blue-600 mt-1">Uploading...</p>}
            {uploadError && <p className="text-xs text-red-600 mt-1">{uploadError}</p>}
            {formData.url && (
              <img src={formData.url} alt="Preview" className="mt-2 w-full h-40 object-cover rounded" />
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="gallery-orderIndex" className="block text-sm font-medium text-gray-700 mb-1">Order Index</label>
              <input
                id="gallery-orderIndex"
                type="number"
                placeholder="0"
                value={formData.orderIndex}
                onChange={(e) => setFormData({...formData, orderIndex: parseInt(e.target.value) || 0})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="gallery-isPublished" className="flex items-center space-x-2">
                <input
                  id="gallery-isPublished"
                  type="checkbox"
                  checked={formData.isPublished}
                  onChange={(e) => setFormData({...formData, isPublished: e.target.checked})}
                  className="rounded border-gray-300"
                />
                <span className="text-sm font-medium text-gray-700">Published</span>
              </label>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="gallery-tags" className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
              <input
                id="gallery-tags"
                type="text"
                placeholder="Tags (comma separated)"
                value={formData.tags.join(', ')}
                onChange={(e) => setFormData({...formData, tags: e.target.value.split(',').map(tag => tag.trim())})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
            <div>
              <label htmlFor="gallery-photographer" className="block text-sm font-medium text-gray-700 mb-1">Photographer</label>
              <input
                id="gallery-photographer"
                type="text"
                placeholder="Photographer"
                value={formData.photographer}
                onChange={(e) => setFormData({...formData, photographer: e.target.value})}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
              />
            </div>
          </div>
          <div className="flex space-x-2">
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={uploading}
              className={`flex-1 px-4 py-2 rounded-lg ${
                uploading 
                  ? 'bg-gray-400 text-gray-200 cursor-not-allowed' 
                  : 'bg-blue-600 text-white hover:bg-blue-700'
              }`}
            >
              {uploading ? 'Uploading...' : (item ? 'Update' : 'Create')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
} 