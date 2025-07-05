import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { SlackOAuthService } from '../services/slack-oauth.service';
import { DatabaseService } from '../services/database.service';
import { SchedulerService } from '../services/scheduler.service';

const router = Router();
const slackOAuth = SlackOAuthService.getInstance();
const db = DatabaseService.getInstance();
const scheduler = SchedulerService.getInstance();

// GET /api/messages/channels - Get list of channels
router.get('/channels', async (req: Request, res: Response): Promise<void> => {
  try {
    const { team_id, user_id } = req.query;
    
    if (!team_id || !user_id) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing team_id or user_id' 
      });
      return;
    }

    const webClient = await slackOAuth.createWebClient(team_id as string, user_id as string);
    
    // Get public channels
    const channelsResult = await webClient.conversations.list({
      types: 'public_channel,private_channel',
      limit: 100
    });

    // Get DMs and group messages
    const imsResult = await webClient.conversations.list({
      types: 'im,mpim',
      limit: 100
    });

    const channels = [
      ...(channelsResult.channels || []),
      ...(imsResult.channels || [])
    ].map(channel => ({
      id: channel.id,
      name: channel.name || `DM-${channel.id}`,
      is_private: channel.is_private,
      is_im: channel.is_im,
      is_mpim: channel.is_mpim
    }));

    res.json({
      success: true,
      channels
    });
  } catch (error) {
    console.error('Error fetching channels:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch channels' 
    });
  }
});

// POST /api/messages/send - Send immediate message
router.post('/send', [
  body('channel_id').notEmpty().withMessage('Channel ID is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('team_id').notEmpty().withMessage('Team ID is required'),
  body('user_id').notEmpty().withMessage('User ID is required'),
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { channel_id, message, team_id, user_id } = req.body;
    
    const webClient = await slackOAuth.createWebClient(team_id, user_id);
    
    const result = await webClient.chat.postMessage({
      channel: channel_id,
      text: message,
    });

    if (result.ok) {
      res.json({
        success: true,
        message: 'Message sent successfully',
        timestamp: result.ts
      });
    } else {
      throw new Error(`Slack API error: ${result.error}`);
    }
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to send message' 
    });
  }
});

// POST /api/messages/schedule - Schedule a message
router.post('/schedule', [
  body('channel_id').notEmpty().withMessage('Channel ID is required'),
  body('channel_name').notEmpty().withMessage('Channel name is required'),
  body('message').notEmpty().withMessage('Message is required'),
  body('scheduled_time').isISO8601().withMessage('Valid scheduled time is required'),
  body('team_id').notEmpty().withMessage('Team ID is required'),
  body('user_id').notEmpty().withMessage('User ID is required'),
], async (req: Request, res: Response): Promise<void> => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ 
        success: false, 
        error: 'Validation failed',
        details: errors.array()
      });
      return;
    }

    const { channel_id, channel_name, message, scheduled_time, team_id, user_id } = req.body;
    
    // Convert scheduled time to UTC ISO string for consistent storage
    const scheduledDate = new Date(scheduled_time);
    const scheduledUTC = scheduledDate.toISOString();
    const nowUTC = new Date().toISOString();
    
    // Validate that scheduled time is in the future
    if (scheduledUTC <= nowUTC) {
      res.status(400).json({ 
        success: false, 
        error: 'Scheduled time must be in the future' 
      });
      return;
    }

    const messageId = await db.saveScheduledMessage({
      channel_id,
      channel_name,
      message,
      scheduled_time: scheduledUTC, // Store as UTC ISO string
      team_id,
      user_id,
      status: 'pending'
    });

    res.json({
      success: true,
      message: 'Message scheduled successfully',
      messageId,
      scheduled_time
    });
  } catch (error) {
    console.error('Error scheduling message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to schedule message' 
    });
  }
});

// GET /api/messages/scheduled - Get scheduled messages
router.get('/scheduled', async (req: Request, res: Response): Promise<void> => {
  try {
    const { team_id, user_id } = req.query;
    
    if (!team_id || !user_id) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing team_id or user_id' 
      });
      return;
    }

    const messages = await db.getScheduledMessages(team_id as string, user_id as string);
    
    res.json({
      success: true,
      messages
    });
  } catch (error) {
    console.error('Error fetching scheduled messages:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch scheduled messages' 
    });
  }
});

// DELETE /api/messages/scheduled/:id - Cancel scheduled message
router.delete('/scheduled/:id', async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { team_id, user_id } = req.query;
    
    if (!team_id || !user_id) {
      res.status(400).json({ 
        success: false, 
        error: 'Missing team_id or user_id' 
      });
      return;
    }

    const success = await db.cancelScheduledMessage(
      parseInt(id), 
      team_id as string, 
      user_id as string
    );

    if (success) {
      res.json({
        success: true,
        message: 'Scheduled message cancelled successfully'
      });
    } else {
      res.status(404).json({
        success: false,
        error: 'Scheduled message not found or cannot be cancelled'
      });
    }
  } catch (error) {
    console.error('Error cancelling scheduled message:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to cancel scheduled message' 
    });
  }
});

export default router;
