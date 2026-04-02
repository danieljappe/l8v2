import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Save, Music } from 'lucide-react';
import { Artist } from '../../types/admin';
import { apiService, User } from '../../services/api';
import EmbeddingManager from '../EmbeddingManager';
import SimpleEmbeddingInput from './SimpleEmbeddingInput';
import { normalizeSocialMedia } from '../../utils/socialMediaUtils';

interface ArtistFormModalProps {
  artist: Artist | null;
  onClose: () => void;
  onSave: (artist: Artist) => void;
}

const ArtistFormModal: React.FC<ArtistFormModalProps> = ({ artist, onSave, onClose }) => {
  const [formData, setFormData] = useState({
    name: '',
    bio: '',
    imageUrl: '',
    website: '',
    socialMedia: [] as Array<{ platform: string; url: string }>,
    genre: '',
    isBookable: false,
    bookingUserId: '',
    embeddings: [] as any[]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [usersLoading, setUsersLoading] = useState(false);

  useEffect(() => {
    // Load users when component mounts
    const loadUsers = async () => {
      setUsersLoading(true);
      try {
        const response = await apiService.getUsers();
        if (response.data) {
          setUsers(response.data);
        }
      } catch (err) {
        console.error('Failed to load users:', err);
      } finally {
        setUsersLoading(false);
      }
    };
    loadUsers();
  }, []);

  useEffect(() => {
    if (artist) {
      // Convert social media data to consistent array format
      const socialMediaArray = normalizeSocialMedia(artist.socialMedia);
      
      setFormData({
        name: artist.name,
        bio: artist.bio || '',
        imageUrl: artist.imageUrl || '',
        website: artist.website || '',
        socialMedia: socialMediaArray,
        genre: artist.genre || '',
        isBookable: artist.isBookable || false,
        bookingUserId: artist.bookingUserId || '',
        embeddings: artist.embeddings || []
      });
    } else {
      setFormData({
        name: '',
        bio: '',
        imageUrl: '',
        website: '',
        socialMedia: [],
        genre: '',
        isBookable: false,
        bookingUserId: '',
        embeddings: []
      });
    }
  }, [artist]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const artistData: any = {
        ...formData,
        bookingUserId: formData.isBookable && formData.bookingUserId ? formData.bookingUserId : null,
        updatedAt: new Date().toISOString()
      };
      // Remove bookingUserId if not bookable
      if (!formData.isBookable) {
        delete artistData.bookingUserId;
      }

      if (artist) {
        // Update existing artist
        const response = await apiService.updateArtist(artist.id, artistData);
        if (response.error) {
          setError(response.error);
        } else if (response.data) {
          onSave(response.data);
          onClose();
        }
      } else {
        // Create new artist
        const response = await apiService.createArtist(artistData);
        if (response.error) {
          setError(response.error);
        } else if (response.data) {
          onSave(response.data);
          onClose();
        }
      }
    } catch (err) {
      setError('Failed to save artist');
    } finally {
      setLoading(false);
    }
  };

  const handleSocialMediaChange = (index: number, field: 'platform' | 'url', value: string) => {
    const newSocialMedia = [...formData.socialMedia];
    newSocialMedia[index][field] = value;
    setFormData({ ...formData, socialMedia: newSocialMedia });
  };

  const addSocialMedia = () => {
    setFormData({
      ...formData,
      socialMedia: [...formData.socialMedia, { platform: '', url: '' }]
    });
  };

  const removeSocialMedia = (index: number) => {
    const newSocialMedia = formData.socialMedia.filter((_, i) => i !== index);
    setFormData({ ...formData, socialMedia: newSocialMedia });
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ type: "spring", damping: 25, stiffness: 300 }}
          onClick={e => e.stopPropagation()}
          className="relative w-full max-w-4xl max-h-[90vh] overflow-hidden bg-white rounded-3xl shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-200">
            <h2 className="text-2xl font-bold text-gray-900">
              {artist ? 'Edit Artist' : 'Add New Artist'}
            </h2>
            <motion.button
              whileHover={{ scale: 1.1, rotate: 90 }}
              whileTap={{ scale: 0.9 }}
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-all duration-200"
            >
              <X className="w-6 h-6" />
            </motion.button>
          </div>

          {/* Form Content */}
          <div className="overflow-y-auto max-h-[calc(90vh-140px)]">
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                  {error}
                </div>
              )}

              {/* Basic Information */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Artist Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Genre
                  </label>
                  <input
                    type="text"
                    value={formData.genre}
                    onChange={(e) => setFormData({ ...formData, genre: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Bookable Status */}
              <div className="space-y-3">
                <div className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    id="isBookable"
                    checked={formData.isBookable}
                    onChange={(e) => setFormData({ ...formData, isBookable: e.target.checked, bookingUserId: e.target.checked ? formData.bookingUserId : '' })}
                    className="w-4 h-4 text-blue-600 bg-gray-100 border-gray-300 rounded focus:ring-blue-500 focus:ring-2"
                  />
                  <label htmlFor="isBookable" className="text-sm font-medium text-gray-700">
                    Available for booking
                  </label>
                </div>
                
                {/* Booking User Selection - Only show if bookable */}
                {formData.isBookable && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Booking Contact User
                    </label>
                    <select
                      value={formData.bookingUserId}
                      onChange={(e) => setFormData({ ...formData, bookingUserId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      disabled={usersLoading}
                    >
                      <option value="">Select a user...</option>
                      {users.map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.firstName && user.lastName 
                            ? `${user.firstName} ${user.lastName} (${user.email})`
                            : user.email}
                        </option>
                      ))}
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Select the user who will handle bookings for this artist
                    </p>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Bio
                </label>
                <textarea
                  value={formData.bio}
                  onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    value={formData.imageUrl}
                    onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Website
                  </label>
                  <input
                    type="url"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              {/* Social Media */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Social Media
                </label>
                <div className="space-y-3">
                  {formData.socialMedia.map((media, index) => (
                    <div key={index} className="flex gap-3">
                      <input
                        type="text"
                        placeholder="Platform (e.g., Instagram)"
                        value={media.platform}
                        onChange={(e) => handleSocialMediaChange(index, 'platform', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <input
                        type="url"
                        placeholder="URL"
                        value={media.url}
                        onChange={(e) => handleSocialMediaChange(index, 'url', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                      <button
                        type="button"
                        onClick={() => removeSocialMedia(index)}
                        className="px-3 py-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={addSocialMedia}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 text-gray-600 hover:border-blue-500 hover:text-blue-600 rounded-lg transition-colors"
                  >
                    + Add Social Media
                  </button>
                </div>
              </div>

              {/* Embeddings Section */}
              <div className="border-t border-gray-200 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Music className="w-5 h-5 mr-2" />
                  Music & Media
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Add Spotify, YouTube, or SoundCloud embeds to showcase the artist's music and videos.
                </p>
                
                {/* Use SimpleEmbeddingInput for both new and existing artists in admin form */}
                <SimpleEmbeddingInput
                  embeddings={formData.embeddings}
                  onEmbeddingsChange={(embeddings) => setFormData({ ...formData, embeddings })}
                  artistId={artist?.id}
                  isEditing={!!artist}
                />
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-6 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 text-white hover:bg-blue-700 rounded-lg transition-colors flex items-center space-x-2 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{artist ? 'Update Artist' : 'Create Artist'}</span>
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ArtistFormModal;
