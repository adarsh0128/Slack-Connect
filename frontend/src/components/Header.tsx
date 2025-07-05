import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useSlack } from '../contexts/SlackContext';
import { Slack, Home, MessageSquare, Calendar, LogOut } from 'lucide-react';

const Header: React.FC = () => {
  const { isAuthenticated, user, logout } = useSlack();
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const handleLogout = () => {
    logout();
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-slack-primary rounded-lg flex items-center justify-center">
              <Slack className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold text-gray-900">Slack Connect</span>
          </Link>

          {/* Navigation */}
          <nav className="flex items-center space-x-6">
            <Link
              to="/"
              className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                isActive('/')
                  ? 'bg-slack-primary text-white'
                  : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
              }`}
            >
              <Home className="h-4 w-4" />
              <span>Home</span>
            </Link>

            {isAuthenticated && (
              <>
                <Link
                  to="/dashboard"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/dashboard')
                      ? 'bg-slack-primary text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <MessageSquare className="h-4 w-4" />
                  <span>Dashboard</span>
                </Link>

                <Link
                  to="/scheduled"
                  className={`flex items-center space-x-1 px-3 py-2 rounded-lg transition-colors ${
                    isActive('/scheduled')
                      ? 'bg-slack-primary text-white'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                  }`}
                >
                  <Calendar className="h-4 w-4" />
                  <span>Scheduled</span>
                </Link>
              </>
            )}
          </nav>

          {/* User Section */}
          <div className="flex items-center space-x-4">
            {isAuthenticated && user ? (
              <div className="flex items-center space-x-3">
                <div className="text-right">
                  <div className="text-sm font-medium text-gray-900">
                    Connected to Slack
                  </div>
                  <div className="text-xs text-gray-500">
                    {user.team_name || user.team_id}
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex items-center space-x-1 text-gray-600 hover:text-gray-900 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
                  title="Disconnect from Slack"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="hidden sm:inline">Disconnect</span>
                </button>
              </div>
            ) : (
              <div className="text-sm text-gray-500">
                Not connected
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
