import { API_CONFIG } from '@/config/api';

export interface Chat {
  id: string;
  type: 'personal' | 'group';
  name: string;
  avatar_url: string | null;
  participants: string[];
  last_message_text: string | null;
  last_message_at: string | null;
  unread_count: number;
  created_at: string;
  participant_name?: string;
  participant_avatar?: string;
  participant_online?: boolean;
}

export interface Message {
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name?: string;
  content?: string;
  encrypted_content?: string;
  type: string;
  status: string;
  classification_label?: string;
  is_destroyed?: boolean;
  created_at: string;
}

class ChatAdminService {
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

  async getAllChats(): Promise<Chat[]> {
    try {
      const response = await this.request<{ chats: Chat[]; total: number }>('/chats/admin/list');
      return response.chats || [];
    } catch (error) {
      return [];
    }
  }

  async getChatDetail(chatId: string): Promise<{ messages: Message[] }> {
    return this.request(`/chats/admin/messages/${chatId}?limit=100`);
  }

  async getChatParticipants(chatId: string): Promise<{ participants: any[] }> {
    return this.request(`/chats/admin/participants/${chatId}`);
  }

  async getChatStats(): Promise<{
    total_chats: number;
    total_messages: number;
    active_today: number;
    personal_chats: number;
    group_chats: number;
  }> {
    return this.request('/chats/admin/stats');
  }

  async deleteChat(chatId: string): Promise<{ success: boolean }> {
    return this.request(`/chats/admin/delete/${chatId}`, { method: 'DELETE' });
  }
}

export default new ChatAdminService();