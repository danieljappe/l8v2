import { useState, useEffect, useMemo } from 'react';
import { Plus, Edit, Trash2, Globe, Music, Calendar } from 'lucide-react';
import { Artist } from '../../types/admin';
import ArtistFormModal from './ArtistFormModal';

interface ArtistsListProps {
  artists: Artist[];
  onAddArtist: (artistData: Omit<Artist, 'id' | 'createdAt'>) => void;
  onUpdateArtist: (artist: Artist) => void;
  onDeleteArtist: (id: string) => void;
}

export default function ArtistsList({
  artists,
  onAddArtist,
  onUpdateArtist,
  onDeleteArtist
}: ArtistsListProps) {
  const [selectedArtist, setSelectedArtist] = useState<Artist | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Sort artists: bookable first, then by name
  const sortedArtists = useMemo(() => {
    return [...artists].sort((a, b) => {
      // First sort by isBookable (true first)
      if (a.isBookable !== b.isBookable) {
        return b.isBookable ? 1 : -1;
      }
      // Then sort alphabetically by name
      return a.name.localeCompare(b.name);
    });
  }, [artists]);

  // Update selectedArtist if the artist data changes
  useEffect(() => {
    if (selectedArtist && !isCreating) {
      const updatedArtist = artists.find(artist => artist.id === selectedArtist.id);
      if (updatedArtist) {
        setSelectedArtist(updatedArtist);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [artists, selectedArtist?.id, isCreating]);

  const handleEdit = (artist: Artist) => {
    setSelectedArtist(artist);
    setIsCreating(false);
  };

  const handleCreate = () => {
    setSelectedArtist(null);
    setIsCreating(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this artist?')) {
      onDeleteArtist(id);
    }
  };

  const handleCloseModal = () => {
    setSelectedArtist(null);
    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Artists Management</h1>
          <p className="text-gray-600">Manage all your artists and performers.</p>
        </div>
        <button
          onClick={handleCreate}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Artist</span>
        </button>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Artist
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Genre
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Media & Links
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Updated
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedArtists.map((artist) => (
                <tr key={artist.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center overflow-hidden">
                        {artist.imageUrl ? (
                          <img 
                            src={artist.imageUrl} 
                            alt={artist.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              const fallback = e.currentTarget.nextElementSibling;
                              if (fallback) {
                                (fallback as HTMLElement).style.display = 'flex';
                              }
                            }}
                          />
                        ) : null}
                        <div 
                          className={`w-full h-full bg-gradient-to-br from-l8-blue to-l8-blue-light flex items-center justify-center ${artist.imageUrl ? 'hidden' : ''}`}
                        >
                          <span className="text-white text-sm font-bold">
                            {artist.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {artist.name}
                          {artist.isBookable && (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              <Calendar className="w-3 h-3 mr-1" />
                              Bookable
                            </span>
                          )}
                        </div>
                        {artist.bio && (
                          <div className="text-sm text-gray-500 line-clamp-1 max-w-md">
                            {artist.bio}
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {artist.genre ? (
                      <div className="flex items-center">
                        <Music className="w-4 h-4 text-gray-400 mr-1" />
                        <span className="text-sm text-gray-900">{artist.genre}</span>
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">—</span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                      Active
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center space-x-3 text-sm text-gray-500">
                      {artist.socialMedia && Array.isArray(artist.socialMedia) && artist.socialMedia.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <span>📱</span>
                          <span>{artist.socialMedia.length}</span>
                        </div>
                      )}
                      {artist.embeddings && artist.embeddings.length > 0 && (
                        <div className="flex items-center space-x-1">
                          <span>🎵</span>
                          <span>{artist.embeddings.length}</span>
                        </div>
                      )}
                      {artist.website && (
                        <div className="flex items-center space-x-1">
                          <Globe className="w-4 h-4 text-blue-500" />
                        </div>
                      )}
                      {!artist.socialMedia?.length && !artist.embeddings?.length && !artist.website && (
                        <span className="text-gray-400">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-500">
                      {artist.updatedAt ? new Date(artist.updatedAt).toLocaleDateString() : 'Unknown'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleEdit(artist)}
                        className="text-blue-600 hover:text-blue-900"
                        title="Edit Artist"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(artist.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete Artist"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Empty State */}
      {sortedArtists.length === 0 && (
        <div className="text-center py-12 bg-white rounded-lg shadow">
          <div className="w-16 h-16 bg-gradient-to-br from-l8-beige-light to-l8-beige rounded-full flex items-center justify-center mx-auto mb-4">
            <div className="w-10 h-10 bg-gradient-to-br from-l8-blue to-l8-blue-dark rounded-full flex items-center justify-center">
              <span className="text-white text-xl">👨‍🎤</span>
            </div>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Artists Yet</h3>
          <p className="text-gray-500 mb-6">Get started by adding your first artist to the roster</p>
          <button
            onClick={handleCreate}
            className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            <span>Add Your First Artist</span>
          </button>
        </div>
      )}

      {/* Artist Form Modal for editing/creating */}
      {(selectedArtist || isCreating) && (
        <ArtistFormModal
          artist={selectedArtist}
          onClose={handleCloseModal}
          onSave={(artist) => {
            if (selectedArtist) {
              onUpdateArtist(artist);
            } else {
              onAddArtist(artist);
            }
          }}
        />
      )}
    </div>
  );
}
