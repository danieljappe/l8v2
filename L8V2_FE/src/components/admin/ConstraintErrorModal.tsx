import React from 'react';
import { AlertTriangle, X, ExternalLink } from 'lucide-react';

interface ConstraintErrorModalProps {
  isOpen: boolean;
  onClose: () => void;
  error: {
    message: string;
    details?: string;
    eventNames?: string;
    eventIds?: string[];
    relatedEvents?: number;
  };
}

const ConstraintErrorModal: React.FC<ConstraintErrorModalProps> = ({
  isOpen,
  onClose,
  error
}) => {
  if (!isOpen) return null;

  const handleGoToEvents = () => {
    // Navigate to events page
    window.location.href = '/admin#events';
    onClose();
  };

  const handleGoToEventArtists = () => {
    // Navigate to event-artists management page
    window.location.href = '/admin#events';
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">
                Cannot Delete Artist
              </h2>
            </div>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        <div className="p-6 space-y-4">
          <div className="text-sm text-gray-600">
            <p className="mb-3">{error.message}</p>
            
            {/* Instructions */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-3">
              <p className="text-green-800 font-medium mb-2">📋 How to resolve this:</p>
              <ol className="text-green-700 text-sm space-y-1 list-decimal list-inside">
                <li>Go to the Events section</li>
                <li>Find the events listed below</li>
                <li>Edit each event and remove this artist</li>
                <li>Come back and try deleting the artist again</li>
              </ol>
            </div>
            
            {error.details && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-yellow-800 font-medium">{error.details}</p>
              </div>
            )}
            
            {error.eventNames && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <div className="space-y-2">
                  <p className="text-blue-800 text-sm font-medium">
                    <strong>Related Events:</strong>
                  </p>
                  <div className="bg-white rounded border border-blue-200 p-2">
                    <p className="text-blue-900 text-sm">
                      {error.eventNames.split(',').map((eventName, index) => (
                        <span key={index} className="inline-block bg-blue-100 text-blue-800 px-2 py-1 rounded mr-2 mb-1">
                          {eventName.trim()}
                        </span>
                      ))}
                    </p>
                  </div>
                  {error.relatedEvents && (
                    <p className="text-blue-700 text-xs mt-1">
                      Total events: {error.relatedEvents}
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
          
          <div className="flex space-x-3">
            <button
              onClick={handleGoToEvents}
              className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center space-x-2"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Go to Events</span>
            </button>
            {error.eventNames && (
              <button
                onClick={handleGoToEventArtists}
                className="flex-1 bg-orange-600 text-white py-2 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
              >
                <ExternalLink className="h-4 w-4" />
                <span>Manage Event Artists</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-lg hover:bg-gray-400 transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConstraintErrorModal;
