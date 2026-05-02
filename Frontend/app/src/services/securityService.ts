import api, { ApiResponse } from './api';
import { API_CONFIG } from '@/app/src/config/api';

export interface SecurityScore {
  overall: number;
  encryption: number;
  authentication: number;
  integrity: number;
  last_updated?: string;
}

export interface SecurityFeature {
  id: string;
  label: string;
  desc: string;
  icon: string;
  color: string;
  active: boolean;
  category: string;
}

export interface KeyVerification {
  id: string;
  contactName: string;
  publicKey?: string;
  algorithm: string;
  fingerprint: string;
  verified: boolean;
  verifiedAt?: string;
}

export interface ForensicLog {
  id: string;
  event: string;
  detail: string;
  category: 'auth' | 'crypto' | 'network' | 'integrity' | 'access';
  severity: 'info' | 'warning' | 'critical';
  hash: string;
  timestamp: number;
}

export interface SecuritySettings {
  two_factor_enabled: boolean;
  session_timeout_minutes: number;
  max_login_attempts: number;
  encryption_level: 'low' | 'medium' | 'high';
  auto_logout_inactive: boolean;
  notify_new_device: boolean;
  notify_suspicious: boolean;
}

class SecurityService {
  private getToken = async (): Promise<string | null> => {
    // Ambil token dari storage
    const token = await import('./storageService').then(m => m.default.getAccessToken());
    return token;
  };

  private async request<T>(endpoint: string, options?: RequestInit): Promise<T> {
    const token = await this.getToken();
    
    const response = await fetch(`${API_CONFIG.baseURL}${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
        ...options?.headers,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || `HTTP ${response.status}`);
    }

    return response.json();
  }

  async getSecurityScore(): Promise<SecurityScore> {
    return this.request<SecurityScore>('/security/score');
  }

  async getSecurityFeatures(): Promise<SecurityFeature[]> {
    const response = await this.request<{ features: SecurityFeature[] }>('/security/features');
    return response.features;
  }

  async getKeyVerifications(): Promise<KeyVerification[]> {
    const response = await this.request<{ keys: any[] }>('/security/keys');
    return response.keys.map(k => ({
      id: k.id,
      contactName: k.contact_name,
      publicKey: k.public_key,
      algorithm: k.algorithm,
      fingerprint: k.fingerprint,
      verified: k.verified,
      verifiedAt: k.verified_at,
    }));
  }

  async verifyKey(contactId: string): Promise<{ success: boolean; verified: boolean }> {
    return this.request('/security/keys/verify', {
      method: 'POST',
      body: JSON.stringify({ contact_id: contactId }),
    });
  }

  async getForensicLogs(limit: number = 50): Promise<ForensicLog[]> {
    const response = await this.request<{ logs: ForensicLog[] }>(`/security/logs?limit=${limit}`);
    return response.logs;
  }

  async getSecuritySettings(): Promise<SecuritySettings> {
    return this.request<SecuritySettings>('/security/settings');
  }

  async updateSecuritySettings(settings: Partial<SecuritySettings>): Promise<{ success: boolean; settings: SecuritySettings }> {
    return this.request('/security/settings', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  }
}

export default new SecurityService();