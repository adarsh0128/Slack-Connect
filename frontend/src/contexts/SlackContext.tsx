import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { authService } from '../services/authService';

interface SlackUser {
  id: string;
  team_id: string;
  team_name?: string;
}

interface SlackContextType {
  user: SlackUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  connectToSlack: () => Promise<void>;
  logout: () => void;
  checkAuthStatus: () => Promise<void>;
  setAuthData: (data: { teamId: string; teamName: string; userId: string; isAuthenticated: boolean }) => void;
}

const SlackContext = createContext<SlackContextType | undefined>(undefined);

interface SlackProviderProps {
  children: ReactNode;
}

export const SlackProvider: React.FC<SlackProviderProps> = ({ children }) => {
  const [user, setUser] = useState<SlackUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user;

  const connectToSlack = useCallback(async () => {
    try {
      const response = await authService.getInstallUrl();
      if (response.installUrl) {
        window.location.href = response.installUrl;
      } else {
        throw new Error('No install URL received');
      }
    } catch (error) {
      console.error('Failed to connect to Slack:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('slack_user');
  }, []);

  const checkAuthStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      
      // Check if user data exists in localStorage
      const savedUser = localStorage.getItem('slack_user');
      if (savedUser) {
        const userData = JSON.parse(savedUser);
        
        // Verify the token is still valid
        const { authenticated } = await authService.checkAuthStatus(
          userData.team_id,
          userData.id
        );
        
        if (authenticated) {
          setUser(userData);
        } else {
          localStorage.removeItem('slack_user');
        }
      }
    } catch (error) {
      console.error('Error checking auth status:', error);
      localStorage.removeItem('slack_user');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const handleOAuthCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const code = urlParams.get('code');
      const state = urlParams.get('state');
      
      if (code) {
        try {
          const authData = await authService.handleCallback(code, state);
          
          if (authData.user && authData.team) {
            const userData = {
              id: authData.user.id,
              team_id: authData.team.id,
              team_name: authData.team.name
            };
            
            setUser(userData);
            localStorage.setItem('slack_user', JSON.stringify(userData));
            
            // Clean up URL
            window.history.replaceState({}, document.title, window.location.pathname);
          } else {
            throw new Error('Invalid authentication data received');
          }
        } catch (error) {
          console.error('OAuth callback error:', error);
        }
      }
    };

    handleOAuthCallback();
  }, []);

  useEffect(() => {
    checkAuthStatus();
  }, [checkAuthStatus]);

  const setAuthData = useCallback((data: { teamId: string; teamName: string; userId: string; isAuthenticated: boolean }) => {
    const userData = {
      id: data.userId,
      team_id: data.teamId,
      team_name: data.teamName
    };
    
    setUser(userData);
    localStorage.setItem('slack_user', JSON.stringify(userData));
  }, []);

  const value: SlackContextType = {
    user,
    isAuthenticated,
    isLoading,
    connectToSlack,
    logout,
    checkAuthStatus,
    setAuthData,
  };

  return (
    <SlackContext.Provider value={value}>
      {children}
    </SlackContext.Provider>
  );
};

export const useSlack = (): SlackContextType => {
  const context = useContext(SlackContext);
  if (context === undefined) {
    throw new Error('useSlack must be used within a SlackProvider');
  }
  return context;
};
