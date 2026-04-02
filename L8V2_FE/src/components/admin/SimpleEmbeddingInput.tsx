import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Plus, X, Music, Youtube, Volume2, AlertCircle } from 'lucide-react';

interface SimpleEmbeddingInputProps {
  embeddings: any[];
  onEmbeddingsChange: (embeddings: any[]) => void;
  artistId?: string; // Optional artist ID for API calls
  isEditing?: boolean; // Whether we're editing an existing artist
}

const SimpleEmbeddingInput: React.FC<SimpleEmbeddingInputProps> = ({ 
  embeddings, 
  onEmbeddingsChange,
  artistId,
  isEditing = false
}) => {
  const [embedCode, setEmbedCode] = useState('');
  const [error, setError] = useState<string | null>(null);

  const validateEmbedCode = (code: string) => {
    if (!code.trim()) {
      return { isValid: false, error: 'Embed code is required' };
    }

    // Check for supported platforms
    if (code.includes('open.spotify.com/embed')) {
      return { isValid: true, platform: 'spotify' };
    }
    if (code.includes('youtube.com/embed') || code.includes('youtu.be')) {
      return { isValid: true, platform: 'youtube' };
    }
    if (code.includes('soundcloud.com/player')) {
      return { isValid: true, platform: 'soundcloud' };
    }

    return { isValid: false, error: 'Unsupported platform. Only Spotify, YouTube, and SoundCloud are supported.' };
  };

  const handleAddEmbedding = () => {
    const validation = validateEmbedCode(embedCode);
    if (!validation.isValid) {
      setError(validation.error || 'Invalid embed code');
      return;
    }

    const newEmbedding = {
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      platform: validation.platform,
      embedCode: embedCode.trim(),
      title: `${validation.platform?.charAt(0).toUpperCase() + validation.platform?.slice(1)} Embed`,
      createdAt: new Date().toISOString()
    };

    onEmbeddingsChange([...embeddings, newEmbedding]);
    setEmbedCode('');
    setError(null);
  };

  const handleRemoveEmbedding = (index: number) => {
    const newEmbeddings = embeddings.filter((_, i) => i !== index);
    onEmbeddingsChange(newEmbeddings);
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'spotify':
        return <Music className="w-4 h-4 text-green-500" />;
      case 'youtube':
        return <Youtube className="w-4 h-4 text-red-500" />;
      case 'soundcloud':
        return <Volume2 className="w-4 h-4 text-orange-500" />;
      default:
        return <Music className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Add Embedding Form */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Add Music or Media Embed</h4>
        
        <div className="space-y-3">
          <div>
            <label className="block text-sm font-medium text-gray-600 mb-1">
              Embed Code
            </label>
            <textarea
              value={embedCode}
              onChange={(e) => setEmbedCode(e.target.value)}
              placeholder="Paste your Spotify, YouTube, or SoundCloud embed code here..."
              className="w-full h-20 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">
              Supported platforms: Spotify, YouTube, SoundCloud
            </p>
          </div>

          {error && (
            <div className="flex items-center space-x-2 text-red-600 text-sm">
              <AlertCircle className="w-4 h-4" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleAddEmbedding}
            disabled={!embedCode.trim()}
            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Embedding</span>
          </button>
        </div>
      </div>

      {/* Current Embeddings */}
      {embeddings.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">Added Embeddings</h4>
          {embeddings.map((embedding, index) => (
            <motion.div
              key={embedding.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-lg p-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {getPlatformIcon(embedding.platform)}
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {embedding.title}
                    </p>
                    <p className="text-xs text-gray-500 capitalize">
                      {embedding.platform}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => handleRemoveEmbedding(index)}
                  className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                  title="Remove embedding"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default SimpleEmbeddingInput;
