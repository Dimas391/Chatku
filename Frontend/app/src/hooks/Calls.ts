export interface CallHistoryItem {
  id: string;
  name: string;
  avatar?: string;
  type: 'video' | 'audio';
  status: 'missed' | 'answered' | 'outgoing';
  time: string;
  duration?: string;
  timestamp: number;
  callId?: string;
  chatId?: string;
  userId?: string;
}

export interface StatusInfo {
  icon: string;
  color: string;
  label: string;
}