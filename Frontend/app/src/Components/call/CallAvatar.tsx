import React from 'react';
import { Image, StyleSheet } from 'react-native';

interface CallAvatarProps {
  avatarUrl: string;
  name: string;
  size?: number;
}

const CallAvatar: React.FC<CallAvatarProps> = ({ 
  avatarUrl, 
  name, 
  size = 120 
}) => {
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF6B35&color=fff&size=${size}`;
  
  return (
    <Image
      source={{ uri: avatarUrl || defaultAvatar }}
      style={[styles.avatar, { width: size, height: size, borderRadius: size / 2 }]}
    />
  );
};

const styles = StyleSheet.create({
  avatar: {
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
});

export default CallAvatar;