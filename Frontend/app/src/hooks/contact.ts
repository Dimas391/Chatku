export interface Contact {
  id: string;
  name: string;
  avatar?: string;
  status: 'online' | 'offline' | 'away';
  lastSeen?: string;
  phoneNumber?: string;
  email?: string;
  isVerified?: boolean;
  mutualFriends?: number;
}

export interface ContactSection {
  title: string;
  data: Contact[];
}