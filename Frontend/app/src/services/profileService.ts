import { Platform } from 'react-native';
import api, { ApiResponse } from './api';
import storageService from './storageService';

export interface UpdateProfileRequest {
  display_name: string;
  username: string;
  bio?: string;
}

export interface UserProfileResponse {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  bio?: string;
  phone?: string;
  email?: string;
  is_verified: boolean;
  created_at: string;
}

class ProfileService {
  // Get my profile
  async getMyProfile(): Promise<ApiResponse<UserProfileResponse>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      const response = await api.get<UserProfileResponse>('/users/me', token);
      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  // Update profile
  async updateProfile(data: UpdateProfileRequest): Promise<ApiResponse<UserProfileResponse>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      const response = await api.patch<UserProfileResponse>('/users/me', {
        display_name: data.display_name,
        username: data.username,
        bio: data.bio || '',
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

  async deleteAvatar(): Promise<ApiResponse<{ avatar_url: null }>> {
  try {
    const token = await storageService.getAccessToken();
    
    if (!token) {
      return {
        success: false,
        error: 'Token tidak ditemukan',
        message: 'Token tidak ditemukan',
      };
    }

    const baseUrl = api.getBaseUrl();
    const response = await fetch(`${baseUrl}/users/me/avatar`, {
      method: 'DELETE',
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
    });

    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        error: data.detail || 'Gagal menghapus foto profil',
        message: data.detail || 'Gagal menghapus foto profil',
      };
    }

    return {
      success: true,
      data: { avatar_url: null },
      message: 'Foto profil berhasil dihapus',
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Network error',
      message: error instanceof Error ? error.message : 'Network error',
    };
  }
}

  // Upload avatar
  async uploadAvatar(avatarUri: string): Promise<ApiResponse<{ avatar_url: string }>> {
    try {
      const token = await storageService.getAccessToken();
      
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan',
          message: 'Token tidak ditemukan',
        };
      }

      // Get filename from URI
      const filename = avatarUri.split('/').pop() || 'avatar.jpg';
      const ext = filename.split('.').pop()?.toLowerCase() || 'jpg';
      const type = (ext === 'jpg' || ext === 'jpeg') ? 'image/jpeg' : `image/${ext}`;

      // Pastikan URI diawali dengan file:// untuk Android jika perlu
      let cleanUri = avatarUri;
      if (Platform.OS === 'android' && !avatarUri.startsWith('file://') && !avatarUri.startsWith('content://')) {
        cleanUri = `file://${avatarUri}`;
      }

      // @ts-ignore - React Native FormData type issue
      const fileData = {
        uri: cleanUri,
        name: filename,
        type,
      };

      const response = await api.uploadFile<{ avatar_url: string }>(
        '/users/me/avatar',
        fileData,
        'file',
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

export default new ProfileService();