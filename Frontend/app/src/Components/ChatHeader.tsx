import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
// 1. Import useSafeAreaInsets
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ChatHeaderProps {
  username?: string;
  avatar?: string;
}

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 11) return 'Selamat Pagi';
  if (hour < 15) return 'Selamat Siang';
  if (hour < 18) return 'Selamat Sore';
  return 'Selamat Malam';
};

const ChatHeader = ({ username, avatar }: ChatHeaderProps) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets(); // 2. Ambil nilai insets
  const greeting = getGreeting();
  const displayName = username && username !== 'Loading...' ? username : '';

  return (
    <View style={[
      styles.container, 
      { 
        backgroundColor: colors.background,
        // 3. Tambahkan paddingTop secara dinamis + padding standar agar tidak mepet
        paddingTop: insets.top + 10 
      }
    ]}>
      {/* Avatar + Greeting */}
      <View style={styles.leftSection}>
        {avatar ? (
          <View style={styles.avatarWrapper}>
            <Image 
              key={avatar}
              source={{ uri: avatar }} 
              style={styles.avatar} 
            />
            <View style={[styles.onlineDot, { borderColor: colors.background }]} />
          </View>
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: colors.surface }]}>
            <MaterialCommunityIcons name="account" size={22} color={colors.textTertiary} />
          </View>
        )}

        <View style={styles.textSection}>
          <Text style={[styles.greeting, { color: colors.textSecondary }]}>
            {greeting}
          </Text>
          {displayName ? (
            <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
              {displayName}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 12, // Tetap gunakan paddingBottom yang konsisten
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 12,
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 1,
    right: 1,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#22C55E',
    borderWidth: 2,
  },
  avatarPlaceholder: {
    width: 46,
    height: 46,
    borderRadius: 23,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textSection: {
    flex: 1,
    justifyContent: 'center',
  },
  greeting: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 1,
  },
  username: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
});

export default ChatHeader;