import api from './api';
import storageService from './storageService';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  needLogin?: boolean;
}

export interface PrivacySettings {
  last_seen: string;
  profile_photo: string;
  status: string;
  read_receipts: boolean;
  typing_indicator: boolean;
  two_factor_auth: boolean;
}

export interface Device {
  id: string;
  name: string;
  location: string;
  is_current: boolean;
  last_active: string;
}

class PrivacyService {
  // Helper untuk mendapatkan token
  private async getToken(): Promise<string | null> {
    return await storageService.getAccessToken();
  }

  async getPrivacySettings(): Promise<ApiResponse<PrivacySettings>> {
    try {
      const token = await this.getToken();
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan. Silakan login kembali.',
        };
      }

      const response = await api.get<PrivacySettings>('/users/me/privacy');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Get privacy settings error:', error);
      
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Sesi berakhir. Silakan login kembali.',
          needLogin: true,
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

 async updatePrivacySettings(settings: Partial<PrivacySettings>): Promise<ApiResponse<PrivacySettings>> {
  try {
    const token = await this.getToken();
    if (!token) {
      return {
        success: false,
        error: 'Token tidak ditemukan. Silakan login kembali.',
      };
    }
    const response = await api.patch<PrivacySettings>('/users/me/privacy', settings, token);
    return { success: true, data: response.data };
  } catch (error: any) {
    return this.handleError<PrivacySettings>(error);
  }
}
    private handleError<T = any>(error: any): ApiResponse<T> {
      console.error('Error:', error);
      
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Sesi berakhir. Silakan login kembali.',
          needLogin: true,
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }

  // Get active devices
  async getActiveDevices(): Promise<ApiResponse<{ devices: Device[] }>> {
    try {
      const response = await api.get<{ devices: Device[] }>('/users/me/devices');
      return {
        success: true,
        data: response.data,
      };
    } catch (error: any) {
      console.error('Get devices error:', error);
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  // Remove device
  async removeDevice(deviceId: string): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await api.delete(`/users/me/devices/${deviceId}`);
      return {
        success: true,
        data: response.data as { success: boolean },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  // Clear chat history
  async clearChatHistory(): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const token = await this.getToken();
      if (!token) {
        return {
          success: false,
          error: 'Token tidak ditemukan. Silakan login kembali.',
        };
      }

      const response = await api.post('/users/me/clear-chat-history', {}, token);

      return {
        success: true,
        data: response.data as { success: boolean },
      };
    } catch (error: any) {
      console.error('Clear chat history error:', error);
      
      if (error.response?.status === 401) {
        return {
          success: false,
          error: 'Sesi berakhir. Silakan login kembali.',
          needLogin: true,
        };
      }
      
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

async deleteAccount(): Promise<ApiResponse<{ success: boolean }>> {
  try {
    const token = await this.getToken();
    if (!token) {
      return {
        success: false,
        error: 'Token tidak ditemukan. Silakan login kembali.',
      };
    }
    const response = await api.post('/users/me/delete-account', {}, token);
    return { success: true, data: response.data as { success: boolean } };
  } catch (error: any) {
    return this.handleError<{ success: boolean }>(error);
  }
}
  // Enable/disable two factor auth
  async toggleTwoFactorAuth(enabled: boolean): Promise<ApiResponse<{ success: boolean }>> {
    try {
      const response = await api.patch<{ success: boolean }>('/users/me/privacy', { two_factor_auth: enabled });
      return {
        success: true,
        data: response.data as { success: boolean },
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.detail || error.message,
      };
    }
  }

  async refreshSession(): Promise<boolean> {
  try {
    const refreshToken = await storageService.getRefreshToken() as unknown as string | null;
    
    if (!refreshToken) {
      console.log("No refresh token found");
      return false;
    }
    
    const response = await api.post<{ access_token: string }>('/auth/refresh', { 
      refresh_token: refreshToken 
    });

    if (response.data?.access_token) {
      await storageService.saveTokens(response.data.access_token, refreshToken);
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Refresh session error:', error);
    return false;
  }
}
}

export default new PrivacyService();