import api from '@/app/src/config/api';
import { AxiosResponse } from 'axios';
import { ApiResponse } from './api';

export interface VideoCallInitiateRequest {
  callee_id: string;
  chat_id: string;
}

export interface VideoCallResponse {
  error: string;
  data: any;
  success: any;
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

export interface ICEServer {
  urls: string[];
  username?: string;
  credential?: string;
}

class VideoCallService {
  async getIceServers(): Promise<ICEServer[]> {
    try {
      const response = await api.get<{ ice_servers: ICEServer[] }>('/calls/ice-servers');
      return response.data.ice_servers;
    } catch (error) {
      return [
        { urls: ['stun:stun.l.google.com:19302'] },
        { urls: ['stun:stun1.l.google.com:19302'] },
      ];
    }
  }

  async deleteVideoCallHistory(callId: string): Promise<ApiResponse> {
  try {
    const token = await this.getToken();
    const response: AxiosResponse = await api.delete(`/video-calls/${callId}`, this.getAuthHeader(token));
    
    if (response.data) {
      return { success: true, data: response.data };
    }
    
    return { success: false, error: 'Failed to delete video call history' };
  } catch (error: any) {
    console.error('Delete video call history error:', error);
    return { 
      success: false, 
      error: error.response?.data?.detail || error.message || 'Unknown error occurred' 
    };
  }
}
  getToken() {
    throw new Error('Method not implemented.');
  }
  getAuthHeader(token: any): import("axios").AxiosRequestConfig<any> | undefined {
    throw new Error('Method not implemented.');
  }

  async initiateVideoCall(request: VideoCallInitiateRequest): Promise<VideoCallResponse> {
    const response = await api.post<VideoCallResponse>('/video-calls/initiate', {
      ...request,
      type: 'video',
    });
    return response.data;
  }

  async answerVideoCall(callId: string): Promise<{ call_id: string; state: string }> {
    const response = await api.post(`/video-calls/${callId}/answer`);
    return response.data;
  }

  async declineVideoCall(callId: string): Promise<{ call_id: string; state: string }> {
    const response = await api.post(`/video-calls/${callId}/decline`);
    return response.data;
  }

  async endVideoCall(callId: string): Promise<{ call_id: string; state: string; duration_seconds?: number }> {
    const response = await api.post(`/video-calls/${callId}/end`);
    return response.data;
  }
}

export default new VideoCallService();