import { API_CONFIG } from '@/config/api';

interface AdminLoginResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  admin: {
    id: string;
    username: string;
    name: string;
    role: string;
  };
}

export interface AdminSession {
  id: string;
  username: string;
  name: string;
  role: string;
  token: string;
}

class AdminApiService {
  private async request<T>(
    endpoint: string,
    options?: RequestInit
  ): Promise<T> {
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async login(username: string, password: string): Promise<AdminLoginResponse> {
    console.log('[AdminAPI] Login request to:', `${API_CONFIG.BASE_URL}/admin/login`);
    return this.request('/admin/login', {
      method: 'POST',
      body: JSON.stringify({ username, password }),
    });
  }

  async verifyToken(token: string): Promise<{ valid: boolean; admin: AdminSession }> {
    const response = await fetch(`${API_CONFIG.BASE_URL}/admin/verify?token=${token}`);
    if (!response.ok) {
      throw new Error('Token tidak valid');
    }
    return response.json();
  }

  getSession(): AdminSession | null {
    try {
      const raw = localStorage.getItem('admin_session');
      console.log('[AdminAPI] getSession raw:', raw);
      if (raw) {
        const session = JSON.parse(raw);
        console.log('[AdminAPI] getSession parsed:', session);
        return session;
      }
    } catch (error) {
      console.error('[AdminAPI] Failed to get session:', error);
    }
    return null;
  }

  saveSession(session: AdminSession): void {
    console.log('[AdminAPI] Saving session:', session);
    localStorage.setItem('admin_session', JSON.stringify(session));
  }

  clearSession(): void {
    console.log('[AdminAPI] Clearing session');
    localStorage.removeItem('admin_session');
  }
}

export default new AdminApiService();