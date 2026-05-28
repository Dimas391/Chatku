import api, { ApiResponse } from './api';
import storageService from '@/app/src/services/storageService';
import encryptionService from '@/app/src/services/encryptionService';

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
  iv: string;
  message_hash: string;
  id: string;
  chat_id: string;
  sender_id: string;
  sender_name?: string;
  sender_avatar?: string;
  type: string;
  content?: string;
  encrypted_content?: string;
  encrypted_content_user?: string;
  encrypted_aes_key?: string;
  encrypted_aes_key_user?: string;
  media_url?: string;
  reply_to_id?: string;
  is_deleted: boolean;
  status: string;
  read_by: string[];
  classification_label?: string;
  is_destroyed?: boolean;
  is_verified?: boolean;
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
  content?: string;
  type: string;
  status: string;
  created_at: string;
  classification_label?: string;
  is_destroyed?: boolean;
  is_verified?: boolean;
}

export interface SendEncryptedMessageResponse {
  success: boolean;
  message_id: string;
  is_verified: boolean;
}

class ChatService {
  async getChats(): Promise<ApiResponse<{ chats: Chat[]; total: number }>> {
    try {
      const token = await storageService.getAccessToken();
      if (!token) return { success: false, error: 'Token tidak ditemukan' };
      return await api.get<{ chats: Chat[]; total: number }>('/chats', token);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async getMessages(chatId: string, beforeId?: string, limit: number = 50): Promise<ApiResponse<{ messages: Message[]; has_more: boolean }>> {
    try {
      const token = await storageService.getAccessToken();
      if (!token) return { success: false, error: 'Token tidak ditemukan' };
      let endpoint = `/chats/${chatId}/messages?limit=${limit}`;
      if (beforeId) endpoint += `&before_id=${beforeId}`;
      return await api.get<{ messages: Message[]; has_more: boolean }>(endpoint, token);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async sendMessage(chatId: string, content: string): Promise<ApiResponse<SendMessageResponse>> {
    return this.sendPlainTextMessage(chatId, content);
  }

  async sendPlainTextMessage(chatId: string, content: string, replyToId?: string): Promise<ApiResponse<SendMessageResponse>> {
    try {
      const token = await storageService.getAccessToken();
      if (!token) return { success: false, error: 'Token tidak ditemukan' };
      return await api.post<SendMessageResponse>(`/chats/${chatId}/messages`, {
        content: content,
        type: 'text',
        reply_to_id: replyToId,
      }, token);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async markAsRead(chatId: string): Promise<ApiResponse<{ updated_count: number }>> {
    try {
      const token = await storageService.getAccessToken();
      if (!token) return { success: false, error: 'Token tidak ditemukan' };
      return await api.patch<{ updated_count: number }>(`/chats/${chatId}/read`, {}, token);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async sendEncryptedMessage(
    chatId: string,
    encryptedData: any,
    classificationLabel?: 'Berisiko' | 'Tidak Berisiko'
  ): Promise<ApiResponse<SendEncryptedMessageResponse>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      console.log('[ENCRYPTED] Mengirim pesan terenkripsi...');
      
      const response = await api.post<SendEncryptedMessageResponse>(
        `/chats/${chatId}/messages/encrypted`,
        {
          encrypted_content: encryptedData.ciphertext,
          encrypted_aes_key: encryptedData.encryptedKey,
          encrypted_aes_key_sender: encryptedData.encryptedSenderKey,
          iv: encryptedData.iv,
          message_hash: encryptedData.hash,
          type: 'text',
          classification_label: classificationLabel || 'Tidak Berisiko',
        },
        token
      );
      
      console.log('[ENCRYPTED] Pesan terkirim');
      return response;
    } catch (error) {
      console.error('[ENCRYPTED] Error:', error);
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
      if (!token) return { success: false, error: 'Token tidak ditemukan' };
      return await api.post<CreateChatResponse>('/chats/personal', {
        participant_id: participantId,
        type: 'personal'
      }, token);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }

  async deleteChat(chatId: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const token = await storageService.getAccessToken();
      if (!token) return { success: false, error: 'Token tidak ditemukan' };
      return await api.delete<{ success: boolean }>(`/chats/${chatId}`, token);
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  }
}

const chatServiceInstance = new ChatService();
export default chatServiceInstance;