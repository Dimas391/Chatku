import React from 'react';
import { View, Text, TouchableOpacity, Image, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { User } from '@/app/src/hooks/useNewChat';

interface UserListItemProps {
  user: User;
  onPress: (user: User) => void;
}

const UserListItem = ({ user, onPress }: UserListItemProps) => {
  const getAvatarUrl = () => {
    return user.avatar_url || 
      `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name)}&background=FF6B35&color=fff`;
  };

  const formatLastSeen = (lastSeen?: string) => {
    if (!lastSeen) return '';
    
    const date = new Date(lastSeen);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins} menit yang lalu`;
    if (diffHours < 24) return `${diffHours} jam yang lalu`;
    if (diffDays < 7) return `${diffDays} hari yang lalu`;
    
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => onPress(user)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: getAvatarUrl() }} style={styles.avatar} />
        {user.is_online && <View style={styles.onlineIndicator} />}
      </View>
      
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user.display_name}</Text>
        <Text style={styles.userUsername}>@{user.username}</Text>
        {!user.is_online && user.last_seen && (
          <Text style={styles.lastSeen}>Terakhir dilihat {formatLastSeen(user.last_seen)}</Text>
        )}
      </View>

      <MaterialCommunityIcons name="chevron-right" size={24} color="#999" />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 16,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  onlineIndicator: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#4CAF50',
    borderWidth: 2,
    borderColor: '#fff',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  userUsername: {
    fontSize: 14,
    color: '#999',
    marginBottom: 2,
  },
  lastSeen: {
    fontSize: 12,
    color: '#ccc',
  },
});

export default UserListItem;