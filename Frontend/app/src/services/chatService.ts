import api, { ApiResponse } from './api';
import storageService from '@/app/src/services/storageService';

export interface Chat {
  id: string;
  type: 'personal' | 'group';
  name?: string;
  avatar_url?: string | null;
  participants: string[];
  last_message_text?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
}

export interface Message {
  sender_name: string;
  id: string;
  chat_id: string;
  sender_id: string;
  type: string;
  content?: string;
  media_url?: string;
  reply_to_id?: string;
  is_deleted: boolean;
  status: string;
  read_by: string[];
  call_status?: string;
  call_duration?: number;
  call_type?: string;
  created_at: string;
}

export interface CreateChatResponse {
  id: string;
  type: string;
  participants: string[];
  is_new: boolean;
  created_at: string;
}

export interface SendMessageResponse {
  id: string;
  chat_id: string;
  sender_id: string;
  content: string;
  type: string;
  status: string;
  created_at: string;
}

class ChatService {
  async getChats(): Promise<ApiResponse<{ chats: Chat[]; total: number }>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      const response = await api.get<{ chats: Chat[]; total: number }>('/chats', token);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async getMessages(chatId: string, beforeId?: string, limit: number = 50): Promise<ApiResponse<{ messages: Message[]; has_more: boolean }>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      let endpoint = `/chats/${chatId}/messages?limit=${limit}`;
      if (beforeId) {
        endpoint += `&before_id=${beforeId}`;
      }

      const response = await api.get<{ messages: Message[]; has_more: boolean }>(endpoint, token);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async sendMessage(chatId: string, content: string, replyToId?: string): Promise<ApiResponse<SendMessageResponse>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      const response = await api.post<SendMessageResponse>(`/chats/${chatId}/messages`, {
        content,
        type: 'text',
        reply_to_id: replyToId,
      }, token);

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async createPersonalChat(participantId: string): Promise<ApiResponse<CreateChatResponse>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      const response = await api.post<CreateChatResponse>('/chats/personal', {
        participant_id: participantId,
        type: 'personal'
      }, token);

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async markAsRead(chatId: string): Promise<ApiResponse<{ updated_count: number }>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      const response = await api.patch<{ updated_count: number }>(`/chats/${chatId}/read`, {}, token);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async deleteMessage(chatId: string, messageId: string, forEveryone: boolean = false): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      const response = await api.delete<{ success: boolean }>(
        `/chats/${chatId}/messages/${messageId}?for_everyone=${forEveryone}`, 
        token
      );

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
}

export default new ChatService();