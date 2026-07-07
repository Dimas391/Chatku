import { API_CONFIG } from '@/config/api';

export interface DashboardStats {
  total_users: number;
  total_messages: number;
  messages_today: number;
  active_sessions: number;
  encrypted_percent: number;
}

export interface MessageTrend {
  month: number;
  month_label: string;
  input: number;
  output: number;
}

export interface ActivityData {
  day: string;
  value: number;
}

export interface PlatformRank {
  label: string;
  value: number;
}

export interface RecentActivity {
  user: string;
  action: string;
  time: string;
}

export interface ClassificationSummary {
  normal: number;
  berisiko: number;
}

export interface ClassificationLog {
  id: string;
  user: string;
  preview: string;
  label: string;
  conf: number;
  time: string;
}

export interface ClassResult {
  label: string;
  confidence: number;
  scores: { label: string; score: number }[];
}

export interface SecurityStatus {
  spam_filter: boolean;
  threat_detection: boolean;
  anti_hoax: boolean;
  model_updated: string;
  classified_today: number;
}

export interface EncryptionStats {
  aes_status: string;
  rsa_status: string;
  total_users_rsa: number;
  percentage_users_rsa: number;
  e2ee_messages_total: number;
  percentage_e2ee: number;
}

export interface FeatureStats {
  total_groups: number;
  total_contacts: number;
  online_pct: number;
  idle_pct: number;
  offline_pct: number;
  feature_usage: { area: string; a: number }[];
  delivery_stats: {
    sent_pct: number;
    failed_pct: number;
    pending_pct: number;
  };
}

class DashboardService {
  private getToken(): string | null {
    // Ambil dari admin_session
    const session = localStorage.getItem('admin_session');
    console.log('[Dashboard] Getting token from session');
    
    if (session) {
      try {
        const parsed = JSON.parse(session);
        if (parsed.token) {
          console.log('[Dashboard] Token found');
          return parsed.token;
        }
      } catch (error) {
        console.error('[Dashboard] Failed to parse session:', error);
      }
    }
    
    console.warn('[Dashboard] No token found');
    return null;
  }

  private async request<T>(endpoint: string): Promise<T> {
    const token = this.getToken();
    
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_CONFIG.BASE_URL}${endpoint}`, {
      headers,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  async getDashboardStats(): Promise<DashboardStats> {
    return this.request('/dashboard/stats');
  }

  async getMessageTrend(): Promise<MessageTrend[]> {
    return this.request('/dashboard/message-trend');
  }

  async getActivitySampling(): Promise<ActivityData[]> {
    return this.request('/dashboard/activity-sampling');
  }

  async getPlatformRanks(): Promise<PlatformRank[]> {
    return this.request('/dashboard/platform-ranks');
  }

  async getRecentActivities(): Promise<RecentActivity[]> {
    return this.request('/dashboard/recent-activities');
  }

  async getClassificationSummary(): Promise<ClassificationSummary> {
    return this.request('/dashboard/classification-summary');
  }

  async getSecurityStatus(): Promise<SecurityStatus> {
    return this.request('/dashboard/security-status');
  }

  async getClassificationLogs(): Promise<ClassificationLog[]> {
    return this.request('/dashboard/classification-logs');
  }

  async classifyTest(text: string): Promise<ClassResult> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_CONFIG.BASE_URL}/dashboard/classify-test`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ text }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return response.json();
  }

  async getEncryptionStats(): Promise<EncryptionStats> {
    return this.request('/dashboard/encryption-stats');
  }

  async getFeatureStats(): Promise<FeatureStats> {
    return this.request('/dashboard/feature-stats');
  }

  async getModelMetadata(): Promise<any> {
    return this.request('/dashboard/model-metadata');
  }
}

export default new DashboardService();