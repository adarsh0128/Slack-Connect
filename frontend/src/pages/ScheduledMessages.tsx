import React, { useState, useEffect } from 'react';
import { useSlack } from '../contexts/SlackContext';
import { messageService, ScheduledMessage } from '../services/messageService';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import { Calendar, Hash, MessageSquare, Users, Trash2, Clock, CheckCircle, XCircle, AlertCircle } from 'lucide-react';

const ScheduledMessages: React.FC = () => {
  const { user, isAuthenticated } = useSlack();
  const [messages, setMessages] = useState<ScheduledMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState<number | null>(null);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadScheduledMessages();
    }
  }, [isAuthenticated, user]);

  const loadScheduledMessages = async () => {
    if (!user) return;

    try {
      setLoading(true);
      const response = await messageService.getScheduledMessages(user.team_id, user.id);
      
      if (response.success && response.messages) {
        setMessages(response.messages);
      } else {
        toast.error('Failed to load scheduled messages');
      }
    } catch (error) {
      console.error('Error loading scheduled messages:', error);
      toast.error('Failed to load scheduled messages');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelMessage = async (messageId: number) => {
    if (!user) return;

    try {
      setCancelling(messageId);
      const response = await messageService.cancelScheduledMessage(
        messageId,
        user.team_id,
        user.id
      );

      if (response.success) {
        toast.success('Message cancelled successfully');
        // Update the message status locally
        setMessages(prev => 
          prev.map(msg => 
            msg.id === messageId 
              ? { ...msg, status: 'cancelled' as const }
              : msg
          )
        );
      } else {
        toast.error(response.error || 'Failed to cancel message');
      }
    } catch (error) {
      console.error('Error cancelling message:', error);
      toast.error('Failed to cancel message');
    } finally {
      setCancelling(null);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-4 w-4 text-yellow-600" />;
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4 text-gray-600" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      default:
        return <Clock className="h-4 w-4 text-gray-600" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'sent':
        return 'bg-green-100 text-green-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getChannelIcon = (channelName: string) => {
    if (channelName.startsWith('DM-')) return <MessageSquare className="h-4 w-4" />;
    if (channelName.includes('mpdm-')) return <Users className="h-4 w-4" />;
    return <Hash className="h-4 w-4" />;
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, 'MMM dd, yyyy h:mm a');
    } catch {
      return 'Invalid date';
    }
  };

  const isPending = (status: string) => status === 'pending';
  const canCancel = (status: string, scheduledTime: string) => {
    return isPending(status) && new Date(scheduledTime) > new Date();
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Scheduled Messages</h1>
        <p className="text-gray-600">Please connect to Slack to view scheduled messages.</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Scheduled Messages</h1>
        <button
          onClick={loadScheduledMessages}
          disabled={loading}
          className="btn-secondary"
        >
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slack-primary"></div>
        </div>
      ) : messages.length > 0 ? (
        <div className="space-y-4">
          {messages.map((message) => (
            <div key={message.id} className="card p-6">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center mb-2">
                    {getChannelIcon(message.channel_name)}
                    <span className="ml-2 font-medium text-gray-900">
                      #{message.channel_name}
                    </span>
                    <span className={`ml-3 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(message.status)}`}>
                      {getStatusIcon(message.status)}
                      <span className="ml-1 capitalize">{message.status}</span>
                    </span>
                  </div>

                  <div className="mb-3">
                    <p className="text-gray-900 whitespace-pre-wrap">{message.message}</p>
                  </div>

                  <div className="flex items-center text-sm text-gray-500 space-x-4">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1" />
                      <span>Scheduled: {formatDateTime(message.scheduled_time)}</span>
                    </div>
                    {message.created_at && (
                      <div className="flex items-center">
                        <span>Created: {formatDateTime(message.created_at)}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="ml-4 flex-shrink-0">
                  {canCancel(message.status, message.scheduled_time) && (
                    <button
                      onClick={() => handleCancelMessage(message.id!)}
                      disabled={cancelling === message.id}
                      className="btn-danger inline-flex items-center"
                    >
                      {cancelling === message.id ? (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                      ) : (
                        <Trash2 className="h-4 w-4 mr-2" />
                      )}
                      {cancelling === message.id ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <Calendar className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-gray-900 mb-2">No scheduled messages</h3>
          <p className="text-gray-600 mb-6">
            You haven't scheduled any messages yet. Go to the dashboard to schedule your first message.
          </p>
          <a
            href="/dashboard"
            className="btn-primary inline-flex items-center"
          >
            <MessageSquare className="h-4 w-4 mr-2" />
            Send a Message
          </a>
        </div>
      )}

      {messages.length > 0 && (
        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-900 mb-2">Status Legend</h3>
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center">
              <Clock className="h-4 w-4 text-yellow-600 mr-1" />
              <span className="text-gray-600">Pending - Waiting to be sent</span>
            </div>
            <div className="flex items-center">
              <CheckCircle className="h-4 w-4 text-green-600 mr-1" />
              <span className="text-gray-600">Sent - Successfully delivered</span>
            </div>
            <div className="flex items-center">
              <XCircle className="h-4 w-4 text-gray-600 mr-1" />
              <span className="text-gray-600">Cancelled - Cancelled before sending</span>
            </div>
            <div className="flex items-center">
              <AlertCircle className="h-4 w-4 text-red-600 mr-1" />
              <span className="text-gray-600">Failed - Error occurred during sending</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ScheduledMessages;
