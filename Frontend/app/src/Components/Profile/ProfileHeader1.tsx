import React from 'react';
import { View, Text, TouchableOpacity, Image, Animated, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UserProfile, StatusOption } from '@/app/src/hooks/Profile';
import { styles } from '@/app/src/utils/Profile';

interface ProfileHeaderProps {
  profile: UserProfile;
  currentStatus: StatusOption;
  avatarScale: Animated.Value;
  onAvatarPress: () => void;
  onStatusPress: () => void;
  uploadingAvatar?: boolean;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  profile,
  currentStatus,
  avatarScale,
  onAvatarPress,
  onStatusPress,
  uploadingAvatar = false,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[
      styles.profileCard, 
      { 
        backgroundColor: colors.background,
        paddingTop: insets.top > 0 ? insets.top + 30 : 40,
        paddingBottom: 20,
      }
    ]}>
      {/* Avatar */}
      <Animated.View style={[styles.avatarWrapper, { transform: [{ scale: avatarScale }] }]}>
        <TouchableOpacity onPress={onAvatarPress} activeOpacity={0.85} disabled={uploadingAvatar}>
          {uploadingAvatar ? (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.card, justifyContent: 'center', alignItems: 'center' }]}>
              <ActivityIndicator size="small" color="#FF6B35" />
            </View>
          ) : profile.avatar ? (
            <Image source={{ uri: profile.avatar }} style={styles.avatar} />
          ) : (
            <View style={[styles.avatarPlaceholder, { backgroundColor: colors.card }]}>
              <Text style={[styles.avatarInitial, { color: colors.text }]}>
                {profile.name ? profile.name.charAt(0) : '?'}
              </Text>
            </View>
          )}
          <View style={[
            styles.avatarEditBadge, 
            { 
              backgroundColor: colors.background, 
              borderColor: colors.border || '#333'
            }
          ]}>
            <MaterialCommunityIcons name="camera" size={13} color="#FF6B35" />
          </View>
        </TouchableOpacity>
      </Animated.View>

      {/* Name & Username */}
      <View style={styles.profileInfo}>
        <View style={styles.nameRow}>
          <Text style={[styles.profileName, { color: colors.text }]}>{profile.name}</Text>
          {profile.verified && (
            <MaterialCommunityIcons name="check-decagram" size={18} color="#2196F3" />
          )}
        </View>
        <Text style={[styles.profileUsername, { color: colors.textSecondary }]}>
          @{profile.username}
        </Text>
        
        {profile.bio ? (
          <Text style={[styles.profileBio, { color: colors.textSecondary }]}>
            {profile.bio}
          </Text>
        ) : null}
      </View>

      {/* Security Badge */}
      <View style={[styles.securityBadge, { backgroundColor: '#4CAF5015' }]}>
        <MaterialCommunityIcons name="shield-check" size={14} color="#4CAF50" />
        <Text style={[styles.securityBadgeText, { color: '#4CAF50' }]}>Aman</Text>
      </View>

      {/* Status Selector */}
      <TouchableOpacity
        style={[
          styles.statusPill, 
          { 
            borderColor: currentStatus.color + '40', 
            backgroundColor: currentStatus.color + '15' 
          }
        ]}
        onPress={onStatusPress}
      >
        <View style={[styles.statusDot, { backgroundColor: currentStatus.color }]} />
        <Text style={[styles.statusText, { color: currentStatus.color }]}>
          {currentStatus.label}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={14} color={currentStatus.color} />
      </TouchableOpacity>
    </View>
  );
};