import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSlack } from '../contexts/SlackContext';
import { Slack, MessageSquare, Calendar, ArrowRight } from 'lucide-react';

const Home: React.FC = () => {
  const { isAuthenticated, user, connectToSlack, isLoading } = useSlack();
  const navigate = useNavigate();

  const handleConnect = async () => {
    try {
      await connectToSlack();
    } catch (error) {
      console.error('Failed to connect:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-slack-primary"></div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Welcome back to Slack Connect!
          </h1>
          <p className="text-xl text-gray-600">
            Connected to team: <span className="font-semibold text-slack-primary">{user.team_name || user.team_id}</span>
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="card p-6">
            <div className="flex items-center mb-4">
              <MessageSquare className="h-8 w-8 text-slack-accent mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900">Send Messages</h2>
            </div>
            <p className="text-gray-600 mb-4">
              Send immediate messages or schedule them for later delivery to any channel in your workspace.
            </p>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn-primary inline-flex items-center"
            >
              Start Messaging
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>

          <div className="card p-6">
            <div className="flex items-center mb-4">
              <Calendar className="h-8 w-8 text-purple-600 mr-3" />
              <h2 className="text-2xl font-semibold text-gray-900">Scheduled Messages</h2>
            </div>
            <p className="text-gray-600 mb-4">
              View and manage all your scheduled messages. Cancel or reschedule as needed.
            </p>
            <button
              onClick={() => navigate('/scheduled')}
              className="btn-secondary inline-flex items-center"
            >
              View Scheduled
              <ArrowRight className="ml-2 h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="mt-12 text-center">
          <h3 className="text-2xl font-semibold text-gray-900 mb-4">Features</h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-slack-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Slack className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Secure OAuth</h4>
              <p className="text-gray-600">
                Connect securely to your Slack workspace with automatic token refresh
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-slack-accent rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Instant & Scheduled</h4>
              <p className="text-gray-600">
                Send messages immediately or schedule them for future delivery
              </p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-purple-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h4 className="font-semibold text-gray-900 mb-2">Message Management</h4>
              <p className="text-gray-600">
                View, cancel, and manage all your scheduled messages in one place
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto text-center">
      <div className="mb-8">
        <div className="w-24 h-24 bg-slack-primary rounded-full flex items-center justify-center mx-auto mb-6">
          <Slack className="h-12 w-12 text-white" />
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Slack Connect
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl mx-auto">
          Connect your Slack workspace to send immediate messages and schedule messages for future delivery. 
          Manage all your communications with ease.
        </p>
      </div>

      <div className="mb-12">
        <button
          onClick={handleConnect}
          className="btn-primary text-lg px-8 py-4 inline-flex items-center"
        >
          <Slack className="mr-3 h-6 w-6" />
          Connect to Slack
        </button>
      </div>

      <div className="grid md:grid-cols-3 gap-8 text-left">
        <div className="card p-6">
          <div className="w-12 h-12 bg-slack-primary rounded-lg flex items-center justify-center mb-4">
            <Slack className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Secure Connection</h3>
          <p className="text-gray-600">
            Connect securely using OAuth 2.0 with automatic token refresh to maintain continuous access.
          </p>
        </div>

        <div className="card p-6">
          <div className="w-12 h-12 bg-slack-accent rounded-lg flex items-center justify-center mb-4">
            <MessageSquare className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Flexible Messaging</h3>
          <p className="text-gray-600">
            Send messages immediately or schedule them for specific dates and times in the future.
          </p>
        </div>

        <div className="card p-6">
          <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center mb-4">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Easy Management</h3>
          <p className="text-gray-600">
            View all scheduled messages and cancel them before they're sent if plans change.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Home;
