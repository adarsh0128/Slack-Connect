import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export interface Channel {
  id: string;
  name: string;
  is_private?: boolean;
  is_im?: boolean;
  is_mpim?: boolean;
}

export interface ScheduledMessage {
  id?: number;
  channel_id: string;
  channel_name: string;
  message: string;
  scheduled_time: string;
  status: 'pending' | 'sent' | 'cancelled' | 'failed';
  team_id: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
}

export interface MessageResponse {
  success: boolean;
  message?: string;
  messageId?: number;
  timestamp?: string;
  scheduled_time?: string;
  error?: string;
  details?: any;
}

export interface ChannelsResponse {
  success: boolean;
  channels?: Channel[];
  error?: string;
}

export interface ScheduledMessagesResponse {
  success: boolean;
  messages?: ScheduledMessage[];
  error?: string;
}

export const messageService = {
  async getChannels(teamId: string, userId: string): Promise<ChannelsResponse> {
    const response = await api.get('/messages/channels', {
      params: { team_id: teamId, user_id: userId }
    });
    return response.data;
  },

  async sendMessage(
    channelId: string,
    message: string,
    teamId: string,
    userId: string
  ): Promise<MessageResponse> {
    const response = await api.post('/messages/send', {
      channel_id: channelId,
      message,
      team_id: teamId,
      user_id: userId
    });
    return response.data;
  },

  async scheduleMessage(
    channelId: string,
    channelName: string,
    message: string,
    scheduledTime: string,
    teamId: string,
    userId: string
  ): Promise<MessageResponse> {
    const response = await api.post('/messages/schedule', {
      channel_id: channelId,
      channel_name: channelName,
      message,
      scheduled_time: scheduledTime,
      team_id: teamId,
      user_id: userId
    });
    return response.data;
  },

  async getScheduledMessages(teamId: string, userId: string): Promise<ScheduledMessagesResponse> {
    const response = await api.get('/messages/scheduled', {
      params: { team_id: teamId, user_id: userId }
    });
    return response.data;
  },

  async cancelScheduledMessage(
    messageId: number,
    teamId: string,
    userId: string
  ): Promise<MessageResponse> {
    const response = await api.delete(`/messages/scheduled/${messageId}`, {
      params: { team_id: teamId, user_id: userId }
    });
    return response.data;
  }
};
