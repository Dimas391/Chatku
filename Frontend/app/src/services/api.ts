import { getApiUrl, BASE_URL } from '../config/api';

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

class ApiService {
  private defaultHeaders: Record<string, string>;

  constructor() {
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  // Method untuk mendapatkan Base URL (TAMBAHKAN INI)
  getBaseUrl(): string {
    return BASE_URL;
  }

  private getHeaders(token?: string): Record<string, string> {
    const headers: Record<string, string> = { ...this.defaultHeaders };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    return headers;
  }


  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    if (!response.ok) {
      let errorDetail = `HTTP Error ${response.status}`;
      try {
        const errorData = await response.json();
        errorDetail = errorData.detail || errorData.message || errorDetail;
      } catch {
        // Ignore
      }
      
      return {
        success: false,
        error: errorDetail,
        message: errorDetail,
      };
    }

    try {
      const data = await response.json();
      return {
        success: true,
        data: data as T,
        message: 'Success',
      };
    } catch (error) {
      return {
        success: false,
        error: 'Invalid response format',
        message: 'Invalid response format',
      };
    }
  }

  async get<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    try {
      const url = getApiUrl(endpoint);
      console.log('🚀 GET:', url);
      
      const response = await fetch(url, {
        method: 'GET',
        headers: this.getHeaders(token),
      });
      
      console.log('📥 Response status:', response.status);
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('❌ GET Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async post<T>(endpoint: string, data: any, token?: string): Promise<ApiResponse<T>> {
    try {
      const url = getApiUrl(endpoint);
      console.log('🚀 POST:', url);
      console.log('📦 Data:', JSON.stringify(data, null, 2));
      
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(token),
        body: JSON.stringify(data),
      });
      
      console.log('📥 Response status:', response.status);
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('❌ POST Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async put<T>(endpoint: string, data: any, token?: string): Promise<ApiResponse<T>> {
    try {
      const url = getApiUrl(endpoint);
      console.log('🚀 PUT:', url);
      
      const response = await fetch(url, {
        method: 'PUT',
        headers: this.getHeaders(token),
        body: JSON.stringify(data),
      });
      
      console.log('📥 Response status:', response.status);
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('❌ PUT Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async patch<T>(endpoint: string, data: any, token?: string): Promise<ApiResponse<T>> {
    try {
      const url = getApiUrl(endpoint);
      console.log('🚀 PATCH:', url);
      console.log('📦 Data:', JSON.stringify(data, null, 2));
      
      const response = await fetch(url, {
        method: 'PATCH',
        headers: this.getHeaders(token),
        body: JSON.stringify(data),
      });
      
      console.log('📥 Response status:', response.status);
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('❌ PATCH Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async delete<T>(endpoint: string, token?: string): Promise<ApiResponse<T>> {
    try {
      const url = getApiUrl(endpoint);
      console.log('🚀 DELETE:', url);
      
      const response = await fetch(url, {
        method: 'DELETE',
        headers: this.getHeaders(token),
      });
      
      console.log('📥 Response status:', response.status);
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('❌ DELETE Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error',
        message: error instanceof Error ? error.message : 'Network error',
      };
    }
  }

  async uploadFile<T>(
    endpoint: string,
    file: any,
    fieldName: string = 'file',
    token?: string
  ): Promise<ApiResponse<T>> {
    try {
      const url = getApiUrl(endpoint);
      console.log('🚀 UPLOAD:', url);
      
      const formData = new FormData();
      formData.append(fieldName, file);

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      });
      
      console.log('📥 Upload response status:', response.status);
      return this.handleResponse<T>(response);
    } catch (error) {
      console.error('❌ UPLOAD Error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed',
        message: error instanceof Error ? error.message : 'Upload failed',
      };
    }
  }
  
}

export default new ApiService();