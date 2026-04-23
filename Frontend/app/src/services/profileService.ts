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

      // Buat FormData untuk upload file
      const formData = new FormData();
      
      // Get filename from URI
      const filename = avatarUri.split('/').pop() || 'avatar.jpg';
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image/jpeg';

      // @ts-ignore - React Native FormData type issue
      formData.append('file', {
        uri: avatarUri,
        name: filename,
        type,
      });

      const baseUrl = api.getBaseUrl();
      const response = await fetch(`${baseUrl}/users/me/avatar`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      
      if (!response.ok) {
        return {
          success: false,
          error: data.detail || 'Gagal upload avatar',
          message: data.detail || 'Gagal upload avatar',
        };
      }

      return {
        success: true,
        data: { avatar_url: data.avatar_url },
        message: 'Avatar berhasil diupload',
      };
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