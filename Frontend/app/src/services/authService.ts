import api from '@/app/src/services/api';

export interface SendOTPRequest {
  type: 'phone' | 'email';
  value: string;
  country_code?: string;
}

export interface VerifyOTPRequest {
  type: 'phone' | 'email';
  value: string;
  otp_code: string;
  country_code?: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

class AuthService {
  async sendOTP(data: SendOTPRequest) {
    
    try {
      // Endpoint tanpa /api/v1 karena sudah di baseURL
      const response = await api.post('/auth/send-otp', data);
      return response;
    } catch (error) {
      throw error;
    }
  }

  async verifyOTP(data: VerifyOTPRequest) {
    const response = await api.post<TokenResponse>('/auth/verify-otp', data);
    return response;
  }

  async refreshToken(refreshToken: string) {
    return api.post<TokenResponse>('/auth/refresh', { refresh_token: refreshToken });
  }

  async logout(token: string) {
    return api.post('/auth/logout', {}, token);
  }

  saveTokens(accessToken: string, refreshToken: string) {
  }

  async getTokens() {
    return {
      accessToken: null,
      refreshToken: null,
    };
  }
}

export default new AuthService();