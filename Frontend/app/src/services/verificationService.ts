import api, { ApiResponse } from './api';

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

class VerificationService {
  async verifyOTP(data: VerifyOTPRequest): Promise<ApiResponse<TokenResponse>> {

    try {
      const response = await api.post<TokenResponse>('/auth/verify-otp', {
        type: data.type,
        value: data.value,
        otp_code: data.otp_code,
        country_code: data.country_code
      });

      return response;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async resendOTP(data: { type: 'phone' | 'email'; value: string; country_code?: string }) {

    try {
      const response = await api.post('/auth/send-otp', {
        type: data.type,
        value: data.value,
        country_code: data.country_code
      });
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

export default new VerificationService();