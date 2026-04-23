import api from '@/app/src/config/api';
import storageService from '@/app/src/services/storageService';

export interface Contact {
  id: string;
  user_id: string;
  name: string;
  display_name: string;
  avatar_url?: string;
  phone?: string;
  email?: string;
  is_online: boolean;
  last_seen?: string;
  is_verified: boolean;
  mutual_friends: number;
  added_at: string;
}

export interface SearchUserResult {
  id: string;
  name: string;
  display_name: string;
  avatar_url?: string;
  phone?: string;
  email?: string;
  is_online: boolean;
  is_verified: boolean;
  is_contact: boolean;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class ContactService {
  private async getToken(): Promise<string | null> {
    return await storageService.getAccessToken();
  }

  private getAuthHeader(token: string | null): any {
    if (token) {
      return {
        headers: {
          Authorization: `Bearer ${token}`
        }
      };
    }
    return {};
  }

  // Ambil daftar kontak
  async getContacts(): Promise<ApiResponse<Contact[]>> {
    try {
      const token = await this.getToken();
      const response = await api.get('/contacts', this.getAuthHeader(token));
      
      if (response.data) {
        return { success: true, data: response.data };
      }
      return { success: false, error: 'Failed to get contacts' };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  }

  // Cari user
  async searchUsers(query: string, limit: number = 20): Promise<ApiResponse<SearchUserResult[]>> {
    try {
      const token = await this.getToken();
      const response = await api.get(`/contacts/search?q=${encodeURIComponent(query)}&limit=${limit}`, this.getAuthHeader(token));
      
      if (response.data) {
        return { success: true, data: response.data };
      }
      return { success: false, error: 'Failed to search users' };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  }

  // Tambah kontak
  async addContact(userId: string): Promise<ApiResponse<Contact>> {
    try {
      const token = await this.getToken();
      const response = await api.post('/contacts/add', { user_id: userId }, this.getAuthHeader(token));
      
      if (response.data) {
        return { success: true, data: response.data.contact };
      }
      return { success: false, error: 'Failed to add contact' };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  }

  async getContactsFromChats(): Promise<ApiResponse<Contact[]>> {
  try {
    const token = await this.getToken();
    const response = await api.get('/contacts/from-chats', this.getAuthHeader(token));
    
    if (response.data) {
      return { success: true, data: response.data };
    }
    return { success: false, error: 'Failed to get contacts from chats' };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.response?.data?.detail || error.message 
    };
  }
}

  // Hapus kontak
  async removeContact(contactId: string): Promise<ApiResponse> {
    try {
      const token = await this.getToken();
      const response = await api.delete(`/contacts/${contactId}`, this.getAuthHeader(token));
      
      if (response.data) {
        return { success: true, data: response.data };
      }
      return { success: false, error: 'Failed to remove contact' };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.detail || error.message 
      };
    }
  }
}

export default new ContactService();