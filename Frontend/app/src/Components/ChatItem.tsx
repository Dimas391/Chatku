import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { ChatItem as ChatItemType } from '@/app/src/hooks/types';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useTranslation } from '@/app/src/hooks/useTranslation';

type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;

interface ChatItemProps {
  chat: ChatItemType;
  onLongPress?: (chat: ChatItemType) => void;
}

const ChatItem = ({ chat, onLongPress }: ChatItemProps) => {
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();
  const [avatarError, setAvatarError] = useState(false);

  // Ambil 2 huruf pertama nama untuk fallback avatar
  const getInitials = (name: string) => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Warna avatar berdasarkan hash nama
  const getAvatarColor = (name: string) => {
    const colors = ['#FF6B35','#3a3869','#00B894','#E17055','#0984E3','#A29BFE','#FD79A8','#55EFC4'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colors[hash % colors.length];
  };

  const showFallback = avatarError || !chat.avatar;

  const handlePress = () => {
    navigation.navigate('ChatDetailScreen', {
      chatId: chat.id,
      chatName: chat.name,
      chatAvatar: chat.avatar,
      online: chat.online,
    });
  };

  const handleLongPress = () => {
    if (onLongPress) onLongPress(chat);
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      onLongPress={handleLongPress}
      activeOpacity={0.6}
    >
      {/* Avatar */}
      <View style={styles.avatarWrapper}>
        {showFallback ? (
          <View style={[styles.avatar, styles.avatarFallback, { backgroundColor: getAvatarColor(chat.name) }]}>
            <Text style={styles.initialsText}>{getInitials(chat.name)}</Text>
          </View>
        ) : (
          <Image
            source={{ uri: chat.avatar }}
            style={styles.avatar}
            onError={() => setAvatarError(true)}
          />
        )}
        {chat.online && (
          <View style={[styles.onlineDot, { borderColor: colors.background }]} />
        )}
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {chat.name}
          </Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>
            {chat.lastMessageTime}
          </Text>
        </View>

        <View style={styles.bottomRow}>
          {chat.typing ? (
            <Text style={[styles.typingText, { color: colors.primary }]}>mengetik...</Text>
          ) : (
            <View style={styles.messageRow}>
              {chat.unreadCount === 0 && (
                <MaterialCommunityIcons
                  name="check-all"
                  size={15}
                  color={colors.textTertiary}
                  style={{ marginRight: 4 }}
                />
              )}
              <Text
                style={[styles.lastMessage, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {chat.lastMessage?.includes('KONTEN BERBAHAYA') || chat.lastMessage?.includes('DIHANCURKAN')
                  ? '⚠️ Pesan berisiko dihapus'
                  : (chat.lastMessage || t('start_conversation'))}
              </Text>
            </View>
          )}

          {chat.unreadCount > 0 && !chat.typing && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {chat.unreadCount > 99 ? '99+' : chat.unreadCount}
              </Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  avatarWrapper: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  avatarFallback: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialsText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  onlineDot: {
    position: 'absolute',
    bottom: 2,
    right: 2,
    width: 13,
    height: 13,
    borderRadius: 7,
    backgroundColor: '#22C55E',
    borderWidth: 2,
  },
  content: {
    flex: 1,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 5,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    flex: 1,
    marginRight: 8,
  },
  time: {
    fontSize: 12,
    fontWeight: '400',
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  lastMessage: {
    fontSize: 13,
    flex: 1,
  },
  typingText: {
    fontSize: 13,
    fontStyle: 'italic',
    flex: 1,
  },
  badge: {
    backgroundColor: '#FF6B35',
    color: '#fff',  
    borderRadius: 50,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  badgeText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '700',
  },
});

export default ChatItem;