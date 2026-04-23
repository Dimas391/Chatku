export type ChatTabType = 'Semua' | 'Personal' | 'Grup';

export interface ChatItem {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  online: boolean;
  typing?: boolean;
}

// Tambahkan tipe untuk API response
export interface ApiChat {
  id: string;
  type: 'personal' | 'group';
  name?: string;
  avatar_url?: string | null;
  participants: string[];
  last_message_text?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
}