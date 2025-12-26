import axios, { AxiosInstance } from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Add token to requests
    this.client.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    });

    // Handle token expiration
    this.client.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          window.location.href = '/login';
        }
        return Promise.reject(error);
      }
    );
  }

  // Auth
  async register(data: {
    email: string;
    password: string;
    full_name: string;
    company?: string;
    position?: string;
    tier?: string;
  }) {
    const response = await this.client.post('/auth/register', data);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  }

  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
    }
    return response.data;
  }

  async getProfile() {
    const response = await this.client.get('/auth/profile');
    return response.data.user;
  }

  // Voice Profile
  async analyzeVoice(samples: string[]) {
    const response = await this.client.post('/voice/analyze', { samples });
    return response.data;
  }

  async getVoiceProfile() {
    const response = await this.client.get('/voice/profile');
    return response.data.profile;
  }

  async updateVoiceProfile(samples: string[]) {
    const response = await this.client.put('/voice/profile', { samples });
    return response.data;
  }

  async getVoiceSuggestions() {
    const response = await this.client.get('/voice/suggestions');
    return response.data.suggestions;
  }

  // Content
  async generateContent(data: {
    topic: string;
    contentType: string;
    tone?: string;
    additionalContext?: string;
    includeHashtags?: boolean;
    targetAudience?: string;
  }) {
    const response = await this.client.post('/content/generate', data);
    return response.data.content;
  }

  async listContent(limit = 50) {
    const response = await this.client.get(`/content?limit=${limit}`);
    return response.data.contents;
  }

  async getContent(id: number) {
    const response = await this.client.get(`/content/${id}`);
    return response.data.content;
  }

  async updateContentStatus(id: number, status: string) {
    const response = await this.client.patch(`/content/${id}/status`, { status });
    return response.data.content;
  }

  async deleteContent(id: number) {
    const response = await this.client.delete(`/content/${id}`);
    return response.data;
  }

  // Trends
  async getTrends(limit = 10) {
    const response = await this.client.get(`/trends?limit=${limit}`);
    return response.data.trends;
  }

  async getContentIdeas(topic: string) {
    const response = await this.client.get(`/content/ideas?topic=${encodeURIComponent(topic)}`);
    return response.data.ideas;
  }

  // Scheduling
  async schedulePost(data: {
    contentId: number;
    socialAccountId: number;
    scheduledTime: string;
  }) {
    const response = await this.client.post('/schedule', data);
    return response.data;
  }

  async getScheduledPosts() {
    const response = await this.client.get('/schedule');
    return response.data.posts;
  }

  async cancelScheduledPost(id: number) {
    const response = await this.client.delete(`/schedule/${id}`);
    return response.data;
  }

  async reschedulePost(id: number, scheduledTime: string) {
    const response = await this.client.patch(`/schedule/${id}`, { scheduledTime });
    return response.data;
  }
}

export const api = new ApiClient();
