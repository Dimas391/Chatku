import { API_CONFIG } from '@/config/api';

export interface User {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  bio: string;
  is_online: boolean;
  is_active?: boolean;
  last_seen: string;
  phone?: string;
  email?: string;
  is_verified?: boolean;
  created_at?: string;
}

export interface UsersResponse {
  users: User[];
  total: number;
}

class UserService {
  private getToken(): string | null {
    const session = localStorage.getItem('admin_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        return parsed.token;
      } catch {
        return null;
      }
    }
    return null;
  }

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  async getAllUsers(search?: string, limit: number = 50): Promise<User[]> {
    const url = search 
      ? `/users/admin/search?q=${encodeURIComponent(search)}&limit=${limit}`
      : `/users/admin/list?limit=${limit}`;
    
    const response = await this.request<{ users: User[] }>(url);
    return response.users || [];
  }

  async searchUsers(query: string, limit: number = 20): Promise<User[]> {
    const response = await this.request<{ users: User[] }>(
      `/users/admin/search?q=${encodeURIComponent(query)}&limit=${limit}`
    );
    return response.users || [];
  }

  async getUserById(userId: string): Promise<User> {
    return this.request<User>(`/users/admin/detail/${userId}`);
  }

  async getUserStats(): Promise<{
    total: number;
    online: number;
    offline: number;
    verified: number;
  }> {
    return this.request('/users/admin/stats');
  }

  async blockUser(userId: string): Promise<{ success: boolean }> {
    return this.request(`/users/admin/block/${userId}`, { method: 'POST' });
  }

  async unblockUser(userId: string): Promise<{ success: boolean }> {
    return this.request(`/users/admin/unblock/${userId}`, { method: 'POST' });
  }

  async deleteUser(userId: string): Promise<{ success: boolean }> {
    return this.request(`/users/admin/delete/${userId}`, { method: 'DELETE' });
  }
}

export default new UserService();