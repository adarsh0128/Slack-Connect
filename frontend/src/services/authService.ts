import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export interface AuthResponse {
  success: boolean;
  installUrl?: string;
  team?: {
    id: string;
    name: string;
  };
  user?: {
    id: string;
  };
  message?: string;
  error?: string;
}

export interface AuthStatusResponse {
  success: boolean;
  authenticated: boolean;
  team_id?: string;
  user_id?: string;
  error?: string;
}

export const authService = {
  async getInstallUrl(state?: string): Promise<AuthResponse> {
    const response = await api.get("/auth/slack", {
      params: { state },
    });
    return response.data;
  },

  async handleCallback(
    code: string,
    state?: string | null
  ): Promise<AuthResponse> {
    const response = await api.get("/auth/slack/callback", {
      params: { code, state },
    });
    return response.data;
  },

  async checkAuthStatus(
    teamId: string,
    userId: string
  ): Promise<AuthStatusResponse> {
    const response = await api.get("/auth/status", {
      params: { team_id: teamId, user_id: userId },
    });
    return response.data;
  },

  async refreshToken(teamId: string, userId: string): Promise<AuthResponse> {
    const response = await api.post("/auth/refresh", {
      team_id: teamId,
      user_id: userId,
    });
    return response.data;
  },
};
