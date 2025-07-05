import React, { useState, useEffect } from 'react';
import { useSlack } from '../contexts/SlackContext';
import { messageService, Channel } from '../services/messageService';
import { toast } from 'react-hot-toast';
import { Send, Clock, Hash, Users, MessageSquare } from 'lucide-react';

const Dashboard: React.FC = () => {
  const { user, isAuthenticated } = useSlack();
  const [channels, setChannels] = useState<Channel[]>([]);
  const [selectedChannel, setSelectedChannel] = useState<Channel | null>(null);
  const [message, setMessage] = useState('');
  const [scheduledTime, setScheduledTime] = useState('');
  const [isScheduled, setIsScheduled] = useState(false);
  const [loading, setLoading] = useState(false);
  const [channelsLoading, setChannelsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated && user) {
      loadChannels();
    }
  }, [isAuthenticated, user]);

  const loadChannels = async () => {
    if (!user) return;
    
    try {
      setChannelsLoading(true);
      const response = await messageService.getChannels(user.team_id, user.id);
      
      if (response.success && response.channels) {
        setChannels(response.channels);
      } else {
        toast.error('Failed to load channels');
      }
    } catch (error) {
      console.error('Error loading channels:', error);
      toast.error('Failed to load channels');
    } finally {
      setChannelsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !selectedChannel || !message.trim()) {
      toast.error('Please select a channel and enter a message');
      return;
    }

    try {
      setLoading(true);

      if (isScheduled) {
        if (!scheduledTime) {
          toast.error('Please select a scheduled time');
          return;
        }

        const scheduledDate = new Date(scheduledTime);
        if (scheduledDate <= new Date()) {
          toast.error('Scheduled time must be in the future');
          return;
        }

        const response = await messageService.scheduleMessage(
          selectedChannel.id,
          selectedChannel.name,
          message,
          scheduledDate.toISOString(),
          user.team_id,
          user.id
        );

        if (response.success) {
          toast.success('Message scheduled successfully!');
          setMessage('');
          setScheduledTime('');
        } else {
          toast.error(response.error || 'Failed to schedule message');
        }
      } else {
        const response = await messageService.sendMessage(
          selectedChannel.id,
          message,
          user.team_id,
          user.id
        );

        if (response.success) {
          toast.success('Message sent successfully!');
          setMessage('');
        } else {
          toast.error(response.error || 'Failed to send message');
        }
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('An error occurred while sending the message');
    } finally {
      setLoading(false);
    }
  };

  const getChannelIcon = (channel: Channel) => {
    if (channel.is_im) return <MessageSquare className="h-4 w-4" />;
    if (channel.is_mpim) return <Users className="h-4 w-4" />;
    if (channel.is_private) return <Hash className="h-4 w-4 text-yellow-600" />;
    return <Hash className="h-4 w-4" />;
  };

  const getMinDateTime = () => {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 1); // At least 1 minute in the future
    return now.toISOString().slice(0, 16);
  };

  if (!isAuthenticated || !user) {
    return (
      <div className="max-w-2xl mx-auto text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Dashboard</h1>
        <p className="text-gray-600">Please connect to Slack to access the dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Send Message</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Channel Selection */}
        <div className="lg:col-span-1">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Select Channel</h2>
          <div className="card p-4 max-h-96 overflow-y-auto">
            {channelsLoading ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slack-primary"></div>
              </div>
            ) : channels.length > 0 ? (
              <div className="space-y-2">
                {channels.map((channel) => (
                  <button
                    key={channel.id}
                    onClick={() => setSelectedChannel(channel)}
                    className={`w-full text-left p-3 rounded-lg transition-colors ${
                      selectedChannel?.id === channel.id
                        ? 'bg-slack-primary text-white'
                        : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center">
                      {getChannelIcon(channel)}
                      <span className="ml-2 truncate">{channel.name}</span>
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No channels found</p>
            )}
          </div>
        </div>

        {/* Message Composition */}
        <div className="lg:col-span-2">
          <div className="card p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              {selectedChannel ? `Send to #${selectedChannel.name}` : 'Compose Message'}
            </h2>

            {selectedChannel && (
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center text-sm text-gray-600">
                  {getChannelIcon(selectedChannel)}
                  <span className="ml-2 font-medium">{selectedChannel.name}</span>
                  {selectedChannel.is_private && (
                    <span className="ml-2 text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded">
                      Private
                    </span>
                  )}
                  {selectedChannel.is_im && (
                    <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                      Direct Message
                    </span>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message here..."
                  className="textarea-field h-32"
                  disabled={loading}
                />
              </div>

              <div className="flex items-center space-x-4">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={isScheduled}
                    onChange={(e) => setIsScheduled(e.target.checked)}
                    className="mr-2"
                    disabled={loading}
                  />
                  <Clock className="h-4 w-4 mr-1" />
                  Schedule for later
                </label>
              </div>

              {isScheduled && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scheduled Time
                  </label>
                  <input
                    type="datetime-local"
                    value={scheduledTime}
                    onChange={(e) => setScheduledTime(e.target.value)}
                    min={getMinDateTime()}
                    className="input-field"
                    disabled={loading}
                  />
                </div>
              )}

              <div className="flex justify-end">
                <button
                  onClick={handleSendMessage}
                  disabled={loading || !selectedChannel || !message.trim()}
                  className={`inline-flex items-center ${
                    isScheduled ? 'btn-secondary' : 'btn-primary'
                  } disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
                  ) : isScheduled ? (
                    <Clock className="h-4 w-4 mr-2" />
                  ) : (
                    <Send className="h-4 w-4 mr-2" />
                  )}
                  {loading
                    ? 'Processing...'
                    : isScheduled
                    ? 'Schedule Message'
                    : 'Send Message'}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
