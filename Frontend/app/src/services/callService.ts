import api from '@/app/src/config/api';
import storageService from '@/app/src/services/storageService';
import { AxiosResponse } from 'axios';

export type CallType = 'audio' | 'video';
export type CallState = 'initiating' | 'ringing' | 'answered' | 'ended' | 'missed' | 'declined' | 'failed' | 'busy';

export interface InitiateCallRequest {
  callee_id: string;
  type: CallType;
  chat_id: string;
}

export interface ICEServer {
  urls: string[];
  username?: string;
  credential?: string;
}

export interface CallResponse {
  call_id: string;
  type: string;
  state: string;
  caller_id: string;
  callee_id: string;
  callee_name?: string;
  callee_avatar?: string;
  chat_id: string;
  started_at: string;
  answered_at?: string;
  ended_at?: string;
  duration_seconds?: number;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

class CallService {
  private async getToken(): Promise<string | null> {
    try {
      return await storageService.getAccessToken();
    } catch (error) {
      return null;
    }
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

  private getDefaultIceServers(): ICEServer[] {
    return [
      { urls: ['stun:stun.l.google.com:19302'] },
      { urls: ['stun:stun1.l.google.com:19302'] },
      { urls: ['stun:stun2.l.google.com:19302'] },
      { urls: ['stun:stun3.l.google.com:19302'] },
      { urls: ['stun:stun4.l.google.com:19302'] },
    ];
  }

  // Get STUN/TURN servers
  async getIceServers(): Promise<ICEServer[]> {
    try {
      const token = await this.getToken();
      const response: AxiosResponse<{ ice_servers: ICEServer[] }> = await api.get('/calls/ice-servers', this.getAuthHeader(token));
      
      if (response.data && response.data.ice_servers) {
        return response.data.ice_servers;
      }
      
      return this.getDefaultIceServers();
    } catch (error) {
      return this.getDefaultIceServers();
    }
  }

  async deleteCallHistory(callId: string): Promise<ApiResponse> {
  try {
    const token = await this.getToken();
    const response: AxiosResponse = await api.delete(`/calls/${callId}`, this.getAuthHeader(token));
    
    if (response.data) {
      return { success: true, data: response.data };
    }
    
    return { success: false, error: 'Failed to delete call history' };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.response?.data?.detail || error.message || 'Unknown error occurred' 
    };
  }
}

  // Initiate a call
 async initiateCall(request: InitiateCallRequest): Promise<ApiResponse<CallResponse>> {
  try {
    const token = await this.getToken();
    
    const response: AxiosResponse<CallResponse> = await api.post('/calls/initiate', request, this.getAuthHeader(token));
    
    if (response.data && response.data.call_id) {
      return { success: true, data: response.data };
    }
    
    return { success: false, error: 'Failed to initiate call - no call_id returned' };
  } catch (error: any) {
    return { 
      success: false, 
      error: error.response?.data?.detail || error.response?.data?.message || error.message || 'Unknown error occurred' 
    };
  }
}

  // Answer a call
  async answerCall(callId: string): Promise<ApiResponse<{ call_id: string; state: string }>> {
    try {
      const token = await this.getToken();
      const response: AxiosResponse<{ call_id: string; state: string }> = await api.post(
        `/calls/${callId}/answer`, 
        {}, 
        this.getAuthHeader(token)
      );
      
      if (response.data) {
        return { success: true, data: response.data };
      }
      
      return { success: false, error: 'Failed to answer call' };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Unknown error occurred' 
      };
    }
  }

  // Decline a call
  async declineCall(callId: string): Promise<ApiResponse<{ call_id: string; state: string }>> {
    try {
      const token = await this.getToken();
      const response: AxiosResponse<{ call_id: string; state: string }> = await api.post(
        `/calls/${callId}/decline`, 
        {}, 
        this.getAuthHeader(token)
      );
      
      if (response.data) {
        return { success: true, data: response.data };
      }
      
      return { success: false, error: 'Failed to decline call' };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Unknown error occurred' 
      };
    }
  }

  // End a call
  async endCall(callId: string): Promise<ApiResponse<{ call_id: string; state: string; duration_seconds?: number }>> {
    try {
      const token = await this.getToken();
      const response: AxiosResponse<{ call_id: string; state: string; duration_seconds?: number }> = await api.post(
        `/calls/${callId}/end`, 
        {}, 
        this.getAuthHeader(token)
      );
      
      if (response.data) {
        return { success: true, data: response.data };
      }
      
      return { success: false, error: 'Failed to end call' };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Unknown error occurred' 
      };
    }
  }

  // Get call details
  async getCall(callId: string): Promise<ApiResponse<CallResponse>> {
    try {
      const token = await this.getToken();
      const response: AxiosResponse<CallResponse> = await api.get(`/calls/${callId}`, this.getAuthHeader(token));
      
      if (response.data) {
        return { success: true, data: response.data };
      }
      
      return { success: false, error: 'Failed to get call details' };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Unknown error occurred' 
      };
    }
  }

  // Get call history
  async getCallHistory(skip: number = 0, limit: number = 20): Promise<ApiResponse<{ calls: CallResponse[]; total: number }>> {
    try {
      const token = await this.getToken();
      
      const response: AxiosResponse<{ calls: CallResponse[]; total: number }> = await api.get(
        `/calls/history?skip=${skip}&limit=${limit}`, 
        this.getAuthHeader(token)
      );
      
      if (response.data) {
        return { success: true, data: response.data };
      }
      
      return { success: false, error: 'Failed to get call history' };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Unknown error occurred' 
      };
    }
  }

  // Send WebRTC signaling via REST (fallback)
  async sendSignal(callId: string, signal: {
    type: string;
    sdp?: string;
    candidate?: any;
    target_user_id: string;
    call_type?: string;
  }): Promise<ApiResponse> {
    try {
      const token = await this.getToken();
      const response: AxiosResponse = await api.post(`/calls/${callId}/signal`, signal, this.getAuthHeader(token));
      
      if (response.data) {
        return { success: true };
      }
      
      return { success: false, error: 'Failed to send signal' };
    } catch (error: any) {
      return { 
        success: false, 
        error: error.response?.data?.message || error.message || 'Unknown error occurred' 
      };
    }
  }
}

export default new CallService();