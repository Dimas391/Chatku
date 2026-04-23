export type UserStatus = 'online' | 'away' | 'busy' | 'offline';

export interface UserProfile {
  id: string;
  name: string;
  display_name: string;
  username: string;
  email: string;
  phone: string;
  bio: string;
  avatar?: string;
  avatar_url?: string | null;
  status: UserStatus;
  joinedAt: string;
  created_at: string;
  verified: boolean;
  is_verified: boolean;
}

export interface StatusOption {
  key: UserStatus;
  label: string;
  color: string;
}   