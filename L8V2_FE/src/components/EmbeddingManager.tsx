import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Edit2, Trash2, Music, Youtube, Volume2, X, Check, AlertCircle } from 'lucide-react';
import { apiService, Embedding } from '../services/api';

interface EmbeddingManagerProps {
  artistId: string;
  embeddings: Embedding[];
  onEmbeddingsChange: (embeddings: Embedding[]) => void;
  isAdmin?: boolean;
  theme?: 'dark' | 'light';
}

const EmbeddingManager: React.FC<EmbeddingManagerProps> = ({ 
  artistId, 
  embeddings = [], 
  onEmbeddingsChange,
  isAdmin = false,
  theme = 'dark'
}) => {
  const [isAdding, setIsAdding] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [embedCode, setEmbedCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddEmbedding = async () => {
    if (!embedCode.trim()) {
      setError('Please enter an embed code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.addEmbedding(artistId, embedCode);
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        onEmbeddingsChange([...embeddings, response.data]);
        setEmbedCode('');
        setIsAdding(false);
      }
    } catch (err) {
      setError('Failed to add embedding');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateEmbedding = async (embeddingId: string) => {
    if (!embedCode.trim()) {
      setError('Please enter an embed code');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.updateEmbedding(artistId, embeddingId, embedCode);
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        const updatedEmbeddings = embeddings.map(emb => 
          emb.id === embeddingId ? response.data : emb
        );
        onEmbeddingsChange(updatedEmbeddings);
        setEmbedCode('');
        setEditingId(null);
      }
    } catch (err) {
      setError('Failed to update embedding');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteEmbedding = async (embeddingId: string) => {
    if (!confirm('Are you sure you want to delete this embedding?')) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await apiService.deleteEmbedding(artistId, embeddingId);
      if (response.error) {
        setError(response.error);
      } else {
        const updatedEmbeddings = embeddings.filter(emb => emb.id !== embeddingId);
        onEmbeddingsChange(updatedEmbeddings);
      }
    } catch (err) {
      setError('Failed to delete embedding');
    } finally {
      setLoading(false);
    }
  };

  const startEditing = (embedding: Embedding) => {
    setEditingId(embedding.id);
    setEmbedCode(embedding.embedCode);
    setError(null);
  };

  const cancelEditing = () => {
    setEditingId(null);
    setEmbedCode('');
    setError(null);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'spotify':
        return <Music className="w-5 h-5 text-green-500" />;
      case 'youtube':
        return <Youtube className="w-5 h-5 text-red-500" />;
      case 'soundcloud':
        return <Volume2 className="w-5 h-5 text-orange-500" />;
      default:
        return <Music className="w-5 h-5 text-gray-500" />;
    }
  };

  const getPlatformColor = (platform: string) => {
    const baseColors = {
      spotify: 'green',
      youtube: 'red',
      soundcloud: 'orange',
      default: 'gray'
    };
    
    const color = baseColors[platform as keyof typeof baseColors] || baseColors.default;
    
    if (theme === 'light') {
      return `bg-${color}-50 border-${color}-200 text-${color}-700`;
    } else {
      return `bg-${color}-500/20 border-${color}-500/30 text-${color}-300`;
    }
  };

  const getThemeClasses = () => {
    if (theme === 'light') {
      return {
        container: 'bg-white border-gray-200',
        text: 'text-gray-900',
        textSecondary: 'text-gray-600',
        textMuted: 'text-gray-500',
        input: 'bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:ring-blue-500 focus:border-blue-500',
        button: 'bg-blue-600 hover:bg-blue-700 text-white',
        buttonSecondary: 'bg-gray-100 hover:bg-gray-200 text-gray-700',
        card: 'bg-white border-gray-200',
        error: 'text-red-600',
        success: 'text-green-600'
      };
    } else {
      return {
        container: 'bg-white/5 backdrop-blur-sm border-white/10',
        text: 'text-white',
        textSecondary: 'text-white/80',
        textMuted: 'text-white/60',
        input: 'bg-white/10 border-white/20 text-white placeholder-white/50 focus:ring-blue-500/50 focus:border-transparent',
        button: 'bg-blue-500/20 hover:bg-blue-500/30 border-blue-500/30 text-blue-300 hover:text-blue-200',
        buttonSecondary: 'bg-gray-500/20 hover:bg-gray-500/30 border-gray-500/30 text-gray-300 hover:text-gray-200',
        card: 'bg-white/5 backdrop-blur-sm border-white/10',
        error: 'text-red-400',
        success: 'text-green-400'
      };
    }
  };

  const themeClasses = getThemeClasses();

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className={`text-lg font-semibold ${themeClasses.text} flex items-center`}>
            <Music className="w-5 h-5 mr-2" />
            Music & Media
          </h3>
          <p className={`text-sm ${themeClasses.textMuted} mt-1`}>
            Add Spotify, YouTube, or SoundCloud embeds
          </p>
        </div>
        {isAdmin && (
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setIsAdding(true)}
            className={`px-4 py-2 ${themeClasses.button} border rounded-lg transition-colors flex items-center`}
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Embedding
          </motion.button>
        )}
      </div>

      {/* Add/Edit Form */}
      <AnimatePresence>
        {(isAdding || editingId) && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
          >
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  Embed Code
                </label>
                <textarea
                  value={embedCode}
                  onChange={(e) => setEmbedCode(e.target.value)}
                  placeholder="Paste your Spotify, YouTube, or SoundCloud embed code here..."
                  className="w-full h-24 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-transparent resize-none"
                />
                <p className="text-xs text-white/60 mt-1">
                  Supported platforms: Spotify, YouTube, SoundCloud
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center space-x-2 text-red-400 text-sm"
                >
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </motion.div>
              )}

              <div className="flex space-x-2">
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={editingId ? () => handleUpdateEmbedding(editingId) : handleAddEmbedding}
                  disabled={loading}
                  className="px-4 py-2 bg-green-500/20 hover:bg-green-500/30 border border-green-500/30 rounded-lg text-green-300 hover:text-green-200 transition-colors flex items-center disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
                  ) : (
                    <Check className="w-4 h-4 mr-2" />
                  )}
                  {editingId ? 'Update' : 'Add'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={cancelEditing}
                  className="px-4 py-2 bg-gray-500/20 hover:bg-gray-500/30 border border-gray-500/30 rounded-lg text-gray-300 hover:text-gray-200 transition-colors flex items-center"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Embeddings List */}
      <div className="space-y-3">
        {embeddings.length === 0 ? (
          <div className="text-center py-8 text-white/60">
            <Music className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>No music or media embeds yet</p>
            {isAdmin && (
              <p className="text-sm mt-1">Click "Add Embedding" to get started</p>
            )}
          </div>
        ) : (
          embeddings.map((embedding) => (
            <motion.div
              key={embedding.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 backdrop-blur-sm rounded-xl p-4 border border-white/10"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <div className={`p-2 rounded-lg border ${getPlatformColor(embedding.platform)}`}>
                    {getPlatformIcon(embedding.platform)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-white font-medium truncate">
                      {embedding.title || `${embedding.platform.charAt(0).toUpperCase() + embedding.platform.slice(1)} Embed`}
                    </h4>
                    {embedding.description && (
                      <p className="text-white/60 text-sm mt-1 truncate">
                        {embedding.description}
                      </p>
                    )}
                    <div className="flex items-center space-x-2 mt-2">
                      <span className={`px-2 py-1 rounded text-xs font-medium ${getPlatformColor(embedding.platform)}`}>
                        {embedding.platform}
                      </span>
                      <span className="text-white/40 text-xs">
                        {new Date(embedding.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
                
                {isAdmin && (
                  <div className="flex space-x-1 ml-2">
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => startEditing(embedding)}
                      className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/20 rounded-lg transition-colors"
                      title="Edit embedding"
                    >
                      <Edit2 className="w-4 h-4" />
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.1 }}
                      whileTap={{ scale: 0.9 }}
                      onClick={() => handleDeleteEmbedding(embedding.id)}
                      className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-colors"
                      title="Delete embedding"
                    >
                      <Trash2 className="w-4 h-4" />
                    </motion.button>
                  </div>
                )}
              </div>
            </motion.div>
          ))
        )}
      </div>
    </div>
  );
};

export default EmbeddingManager;
