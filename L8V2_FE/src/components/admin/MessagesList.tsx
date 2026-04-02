import { useState } from 'react';
import { Mail, User, Clock, Trash2, CheckCircle, AlertCircle, Loader2, Eye, X } from 'lucide-react';
import { Message } from '../../types/admin';

interface MessagesListProps {
  messages: Message[];
  loading?: boolean;
  error?: string | null;
  onMarkAsRead: (id: string) => void;
  onDeleteMessage: (id: string) => void;
}

export default function MessagesList({
  messages,
  loading = false,
  error = null,
  onMarkAsRead,
  onDeleteMessage
}: MessagesListProps) {
  const [selectedMessage, setSelectedMessage] = useState<Message | null>(null);

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this message?')) {
      onDeleteMessage(id);
    }
  };

  const handleViewMessage = (message: Message) => {
    setSelectedMessage(message);
    // Mark as read when viewing
    if (!message.read) {
      onMarkAsRead(message.id);
    }
  };

  const getPriorityColor = (priority: Message['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages Management</h1>
          <p className="text-gray-600">Manage all incoming contact messages and inquiries.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-12">
          <div className="flex flex-col items-center justify-center">
            <Loader2 className="w-8 h-8 text-gray-400 animate-spin mb-4" />
            <p className="text-gray-600">Loading messages...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Messages Management</h1>
          <p className="text-gray-600">Manage all incoming contact messages and inquiries.</p>
        </div>
        <div className="bg-white rounded-lg shadow p-12">
          <div className="flex flex-col items-center justify-center">
            <AlertCircle className="w-8 h-8 text-red-400 mb-4" />
            <p className="text-gray-900 font-medium mb-2">Error loading messages</p>
            <p className="text-gray-600 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Messages Management</h1>
        <p className="text-gray-600">Manage all incoming contact messages and inquiries.</p>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Subject
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Priority
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {messages.map((message) => (
                <tr key={message.id} className={`hover:bg-gray-50 ${!message.read ? 'bg-blue-50' : ''}`}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {message.read ? (
                        <CheckCircle className="w-5 h-5 text-green-500" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-blue-500" />
                      )}
                      <span className="ml-2 text-sm text-gray-900">
                        {message.read ? 'Read' : 'Unread'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center">
                        <User className="w-4 h-4 text-gray-600" />
                      </div>
                      <div className="ml-3">
                        <div className="text-sm font-medium text-gray-900">{message.name}</div>
                        <div className="text-sm text-gray-500">{message.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 max-w-md">
                    <div className="text-sm text-gray-900 font-medium mb-1 break-words">{message.subject}</div>
                    <div className="text-sm text-gray-500 line-clamp-2 break-words">{message.message}</div>
                    {message.message.length > 100 && (
                      <button
                        onClick={() => handleViewMessage(message)}
                        className="mt-1 text-xs text-blue-600 hover:text-blue-800 font-medium underline"
                      >
                        Read more...
                      </button>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(message.priority)}`}>
                      {message.priority}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center text-sm text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      {formatDate(message.createdAt)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewMessage(message)}
                        className="text-blue-600 hover:text-blue-900"
                        title="View full message"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {!message.read && (
                        <button
                          onClick={() => onMarkAsRead(message.id)}
                          className="text-green-600 hover:text-green-900"
                          title="Mark as read"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        onClick={() => handleDelete(message.id)}
                        className="text-red-600 hover:text-red-900"
                        title="Delete message"
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

      {messages.length === 0 && (
        <div className="text-center py-12">
          <Mail className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No messages yet</h3>
          <p className="text-gray-500">When you receive contact messages, they will appear here.</p>
        </div>
      )}

      {/* Message Detail Modal */}
      {selectedMessage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Message Details</h2>
              <button
                onClick={() => setSelectedMessage(null)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Status and Priority */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {selectedMessage.read ? (
                    <span className="flex items-center text-sm text-green-600">
                      <CheckCircle className="w-4 h-4 mr-1" />
                      Read
                    </span>
                  ) : (
                    <span className="flex items-center text-sm text-blue-600">
                      <AlertCircle className="w-4 h-4 mr-1" />
                      Unread
                    </span>
                  )}
                  <span className={`px-3 py-1 text-xs font-medium rounded-full ${getPriorityColor(selectedMessage.priority)}`}>
                    {selectedMessage.priority}
                  </span>
                </div>
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="w-4 h-4 mr-1" />
                  {formatDate(selectedMessage.createdAt)}
                </div>
              </div>

              {/* Contact Information */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Contact Information</h3>
                <div className="flex items-start space-x-3">
                  <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                    <User className="w-5 h-5 text-gray-600" />
                  </div>
                  <div>
                    <div className="text-base font-medium text-gray-900">{selectedMessage.name}</div>
                    <div className="text-sm text-gray-600">{selectedMessage.email}</div>
                  </div>
                </div>
              </div>

              {/* Subject */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-2">Subject</h3>
                <p className="text-base text-gray-900 font-medium">{selectedMessage.subject}</p>
              </div>

              {/* Message */}
              <div className="border-t border-gray-200 pt-4">
                <h3 className="text-sm font-medium text-gray-500 mb-3">Message</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-base text-gray-900 whitespace-pre-wrap break-words">
                    {selectedMessage.message}
                  </p>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gray-200 pt-4 flex items-center justify-end space-x-3">
                {!selectedMessage.read && (
                  <button
                    onClick={() => {
                      onMarkAsRead(selectedMessage.id);
                      setSelectedMessage({ ...selectedMessage, read: true });
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2"
                  >
                    <CheckCircle className="w-4 h-4" />
                    <span>Mark as Read</span>
                  </button>
                )}
                <button
                  onClick={() => {
                    handleDelete(selectedMessage.id);
                    setSelectedMessage(null);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center space-x-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete</span>
                </button>
                <button
                  onClick={() => setSelectedMessage(null)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 