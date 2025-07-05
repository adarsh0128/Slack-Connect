import * as cron from 'node-cron';
import { DatabaseService } from './database.service';
import { SlackOAuthService } from './slack-oauth.service';

export class SchedulerService {
  private static instance: SchedulerService;
  private task: cron.ScheduledTask | null = null;
  private db: DatabaseService;
  private slackService: SlackOAuthService;

  private constructor() {
    this.db = DatabaseService.getInstance();
    this.slackService = SlackOAuthService.getInstance();
  }

  public static getInstance(): SchedulerService {
    if (!SchedulerService.instance) {
      SchedulerService.instance = new SchedulerService();
    }
    return SchedulerService.instance;
  }

  public start(): void {
    // Run every minute to check for pending messages
    this.task = cron.schedule('* * * * *', async () => {
      await this.processPendingMessages();
    }, {
      scheduled: false
    });

    this.task.start();
    console.log('Scheduler service started - checking for pending messages every minute');
  }

  public stop(): void {
    if (this.task) {
      this.task.stop();
      this.task = null;
      console.log('Scheduler service stopped');
    }
  }

  private async processPendingMessages(): Promise<void> {
    try {
      const pendingMessages = await this.db.getPendingMessages();
      
      for (const message of pendingMessages) {
        try {
          await this.sendScheduledMessage(message);
        } catch (error) {
          console.error(`Failed to send scheduled message ${message.id}:`, error);
          await this.db.updateMessageStatus(message.id!, 'failed');
        }
      }
    } catch (error) {
      console.error('Error processing pending messages:', error);
    }
  }

  private async sendScheduledMessage(message: any): Promise<void> {
    const webClient = await this.slackService.createWebClient(
      message.team_id,
      message.user_id
    );

    const result = await webClient.chat.postMessage({
      channel: message.channel_id,
      text: message.message,
    });

    if (result.ok) {
      await this.db.updateMessageStatus(message.id!, 'sent');
    } else {
      throw new Error(`Slack API error: ${result.error}`);
    }
  }

  // Method to schedule a one-time message (alternative to cron-based scheduling)
  public scheduleMessage(messageId: number, scheduledTime: Date): void {
    const delay = scheduledTime.getTime() - Date.now();
    
    if (delay <= 0) {
      // Message should be sent immediately
      this.sendMessageById(messageId);
      return;
    }

    setTimeout(async () => {
      await this.sendMessageById(messageId);
    }, delay);
  }

  private async sendMessageById(messageId: number): Promise<void> {
    try {
      const messages = await this.db.getPendingMessages();
      const message = messages.find(m => m.id === messageId && m.status === 'pending');
      
      if (message) {
        await this.sendScheduledMessage(message);
      }
    } catch (error) {
      console.error(`Failed to send message ${messageId}:`, error);
      await this.db.updateMessageStatus(messageId, 'failed');
    }
  }
}
