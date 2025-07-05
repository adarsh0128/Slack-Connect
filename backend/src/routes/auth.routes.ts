import { Router, Request, Response } from 'express';
import { SlackOAuthService } from '../services/slack-oauth.service';
import { DatabaseService } from '../services/database.service';

const router = Router();
const slackOAuth = SlackOAuthService.getInstance();
const db = DatabaseService.getInstance();

// GET /api/auth/slack - Start OAuth flow
router.get('/slack', async (req: Request, res: Response) => {
  try {
    const state = req.query.state as string;
    const installUrl = await slackOAuth.generateInstallUrl(state);
    
    res.json({ 
      success: true, 
      installUrl 
    });
  } catch (error) {
    console.error('Error generating install URL:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to generate install URL' 
    });
  }
});

// GET /api/auth/slack/callback - Handle OAuth callback
router.get('/slack/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state, error } = req.query;
    
    if (error) {
      console.error('OAuth error:', error);
      res.redirect(`${process.env.FRONTEND_URL}/auth-error?error=${encodeURIComponent(error as string)}`);
      return;
    }
    
    if (!code) {
      res.redirect(`${process.env.FRONTEND_URL}/auth-error?error=missing_code`);
      return;
    }

    const authData = await slackOAuth.handleCallback(code as string, state as string);
    
    // Redirect to frontend with success and user data
    const params = new URLSearchParams({
      success: 'true',
      team_id: authData.team.id,
      team_name: authData.team.name,
      user_id: authData.authed_user.id
    });
    
    res.redirect(`${process.env.FRONTEND_URL}/auth-success?${params.toString()}`);
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.FRONTEND_URL}/auth-error?error=oauth_failed`);
  }
});

// GET /api/auth/status - Check authentication status
router.get('/status', async (req: Request, res: Response): Promise<void> => {
  try {
    const { team_id, user_id } = req.query;
    
    if (!team_id || !user_id) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing team_id or user_id' 
      });
      return;
    }

    const token = await db.getToken(team_id as string, user_id as string);
    
    res.json({
      success: true,
      authenticated: !!token,
      ...(token && {
        team_id: token.team_id,
        user_id: token.user_id
      })
    });
  } catch (error) {
    console.error('Error checking auth status:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to check authentication status' 
    });
  }
});

// POST /api/auth/refresh - Refresh access token
router.post('/refresh', async (req: Request, res: Response): Promise<void> => {
  try {
    const { team_id, user_id } = req.body;
    
    if (!team_id || !user_id) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing team_id or user_id' 
      });
      return;
    }

    const newAccessToken = await slackOAuth.refreshToken(team_id, user_id);
    
    res.json({
      success: true,
      message: 'Token refreshed successfully',
      access_token: newAccessToken
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to refresh token' 
    });
  }
});

export default router;
