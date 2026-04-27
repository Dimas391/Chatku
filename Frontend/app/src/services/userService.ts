import api, { ApiResponse } from './api';
import storageService from './storageService';

export interface UserProfile {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string;
  phone?: string;
  email?: string;
  is_verified: boolean;
  is_online?: boolean;
  last_seen?: string;
  created_at: string;
}

export interface User extends UserProfile {
  // Alias untuk kompatibilitas
}

class UserService {
  // GET /users/{userId}/public-key - Ambil public key user lain
  async getUserPublicKey(userId: string): Promise<ApiResponse<{ public_key: string }>> {
    try {
      const token = await storageService.getAccessToken();
      const response = await api.get<{ public_key: string }>(`/users/${userId}/public-key`, token || undefined);
      
      if (response.success && response.data) {
        console.log('🔑 [PUBKEY] Got public key for user:', userId);
      }
      return response;
    } catch (error) {
      console.error('❌ [PUBKEY] Failed to get public key:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }
  // GET /users/me - Profil saya
  async getMyProfile(): Promise<ApiResponse<UserProfile>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      const response = await api.get<UserProfile>('/users/me', token);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // GET /users/{userId} - Profil user lain
  async getUserById(userId: string): Promise<ApiResponse<UserProfile>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      const response = await api.get<UserProfile>(`/users/${userId}`, token);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // GET /users/search?q=query - Mencari user
  async searchUsers(query: string, limit: number = 20): Promise<ApiResponse<{ users: UserProfile[] }>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      if (query.length < 2) {
        return {
          success: true,
          data: { users: [] },
          message: 'Query terlalu pendek',
        };
      }

      const response = await api.get<{ users: UserProfile[] }>(
        `/users/search?q=${encodeURIComponent(query)}&limit=${limit}`, 
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

  // GET /users/contacts - Mendapatkan daftar kontak
  async getContacts(): Promise<ApiResponse<{ contacts: UserProfile[] }>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      const response = await api.get<{ contacts: UserProfile[] }>('/users/contacts', token);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // PATCH /users/me - Update profil
  async updateProfile(data: {
    display_name?: string;
    username?: string;
    bio?: string;
  }): Promise<ApiResponse<UserProfile>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      const response = await api.patch<UserProfile>('/users/me', data, token);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // POST /users/{targetId}/contact - Tambah kontak
  async addContact(userId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      const response = await api.post<{ success: boolean; message: string }>(
        `/users/${userId}/contact`, 
        {}, 
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

  // DELETE /users/{targetId}/contact - Hapus kontak
  async removeContact(userId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      const response = await api.delete<{ success: boolean; message: string }>(
        `/users/${userId}/contact`, 
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

  // POST /users/{targetId}/block - Blokir user
  async blockUser(userId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      const response = await api.post<{ success: boolean; message: string }>(
        `/users/${userId}/block`, 
        {}, 
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

  // DELETE /users/{targetId}/block - Buka blokir user
  async unblockUser(userId: string): Promise<ApiResponse<{ success: boolean; message: string }>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      const response = await api.delete<{ success: boolean; message: string }>(
        `/users/${userId}/block`, 
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

  // PUT /users/me/notification-token - Update FCM token
  async updateNotificationToken(token: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const accessToken = await storageService.getAccessToken();
      
      if (!accessToken) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      const response = await api.put<{ success: boolean }>(
        '/users/me/notification-token', 
        { token }, 
        accessToken
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

export default new UserService();