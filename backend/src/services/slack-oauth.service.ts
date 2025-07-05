import { WebClient } from '@slack/web-api';
import fetch from 'node-fetch';
import { DatabaseService } from './database.service';

export interface SlackAuthData {
  access_token: string;
  refresh_token?: string;
  team: {
    id: string;
    name: string;
  };
  authed_user: {
    id: string;
    access_token: string;
    refresh_token?: string;
  };
  expires_in?: number;
}

export class SlackOAuthService {
  private static instance: SlackOAuthService;
  private db: DatabaseService;

  private constructor() {
    this.db = DatabaseService.getInstance();
  }

  public static getInstance(): SlackOAuthService {
    if (!SlackOAuthService.instance) {
      SlackOAuthService.instance = new SlackOAuthService();
    }
    return SlackOAuthService.instance;
  }

  public async generateInstallUrl(state?: string): Promise<string> {
    const scopes = ['chat:write', 'channels:read', 'groups:read', 'im:read', 'mpim:read'];
    const params = new URLSearchParams({
      client_id: process.env.SLACK_CLIENT_ID!,
      scope: scopes.join(','),
      redirect_uri: `${process.env.BACKEND_URL || 'https://localhost:3001'}/api/auth/slack/callback`,
      response_type: 'code',
    });

    if (state) {
      params.append('state', state);
    }

    return `https://slack.com/oauth/v2/authorize?${params.toString()}`;
  }

  public async handleCallback(code: string, state?: string | null): Promise<SlackAuthData> {
    try {
      const response = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.SLACK_CLIENT_ID!,
          client_secret: process.env.SLACK_CLIENT_SECRET!,
          code,
          redirect_uri: `${process.env.BACKEND_URL || 'https://localhost:3001'}/api/auth/slack/callback`,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`OAuth error: ${data.error}`);
      }

      // Check for access token in different possible locations
      let accessToken = data.authed_user?.access_token || data.access_token;
      let refreshToken = data.authed_user?.refresh_token || data.refresh_token;
      
      // If still no access token, check bot token
      if (!accessToken && data.bot?.bot_access_token) {
        accessToken = data.bot.bot_access_token;
      }

      if (!accessToken) {
        throw new Error('No access token received from Slack');
      }

      // Store the token
      const expiresAt = data.expires_in 
        ? Math.floor(Date.now() / 1000) + data.expires_in 
        : undefined;

      await this.db.saveToken({
        access_token: accessToken,
        refresh_token: refreshToken,
        team_id: data.team.id,
        user_id: data.authed_user.id,
        expires_at: expiresAt
      });

      return {
        access_token: accessToken,
        refresh_token: refreshToken,
        team: {
          id: data.team.id,
          name: data.team.name
        },
        authed_user: {
          id: data.authed_user.id,
          access_token: accessToken,
          refresh_token: refreshToken,
        },
      };
    } catch (error) {
      console.error('OAuth callback error:', error);
      throw new Error('Failed to handle OAuth callback');
    }
  }

  public async refreshToken(teamId: string, userId: string): Promise<string> {
    const token = await this.db.getToken(teamId, userId);
    
    if (!token || !token.refresh_token) {
      throw new Error('No refresh token available');
    }

    try {
      const response = await fetch('https://slack.com/api/oauth.v2.access', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
          client_id: process.env.SLACK_CLIENT_ID!,
          client_secret: process.env.SLACK_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: token.refresh_token,
        }),
      });

      const data = await response.json();

      if (!data.ok) {
        throw new Error(`Failed to refresh token: ${data.error}`);
      }

      const expiresAt = data.expires_in 
        ? Math.floor(Date.now() / 1000) + data.expires_in 
        : undefined;

      await this.db.updateToken(teamId, userId, {
        access_token: data.access_token,
        refresh_token: data.refresh_token || token.refresh_token,
        expires_at: expiresAt,
      });

      return data.access_token;
    } catch (error) {
      console.error('Error refreshing token:', error);
      throw new Error('Failed to refresh token');
    }
  }

  public async getValidToken(teamId: string, userId: string): Promise<string> {
    const token = await this.db.getToken(teamId, userId);
    
    if (!token) {
      throw new Error('No token found for user');
    }

    // Check if token is expired (with 5 minute buffer)
    const now = Math.floor(Date.now() / 1000);
    const buffer = 5 * 60; // 5 minutes
    
    if (token.expires_at && token.expires_at - buffer <= now) {
      // Token is expired or will expire soon, refresh it
      return await this.refreshToken(teamId, userId);
    }

    return token.access_token;
  }

  public async createWebClient(teamId: string, userId: string): Promise<WebClient> {
    const accessToken = await this.getValidToken(teamId, userId);
    return new WebClient(accessToken);
  }
}
