import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { ChatItem as ChatItemType } from '@/app/src/hooks/types';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useTranslation } from '@/app/src/hooks/useTranslation';

type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;

interface ChatItemProps {
  chat: ChatItemType;
}

const ChatItem = ({ chat }: ChatItemProps) => {
  const navigation = useNavigation<ChatScreenNavigationProp>();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const handlePress = () => {
    navigation.navigate('ChatDetailScreen', {
      chatId: chat.id,
      chatName: chat.name,
      chatAvatar: chat.avatar,
      online: chat.online,
    });
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        <Image source={{ uri: chat.avatar }} style={styles.avatar} />
        {chat.online && <View style={[styles.onlineIndicator, { borderColor: colors.background }]} />}
      </View>

      <View style={styles.content}>
        <View style={styles.header}>
          <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
            {chat.name}
          </Text>
          <Text style={[styles.time, { color: colors.textTertiary }]}>{chat.lastMessageTime}</Text>
        </View>

        <View style={styles.messageContainer}>
          {chat.typing ? (
            <Text style={[styles.typingText, { color: colors.primary }]}>{t('typing')}</Text>
          ) : (
            <Text style={[styles.lastMessage, { color: colors.textSecondary }]} numberOfLines={1}>
              {chat.lastMessage || t('start_conversation')}
            </Text>
          )}

          {chat.unreadCount > 0 && !chat.typing && (
            <View style={[styles.unreadBadge, { backgroundColor: colors.primary }]}>
              <Text style={styles.unreadText}>
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
    paddingVertical: 16,
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
  },
  content: {
    flex: 1,
    justifyContent: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    flex: 1,
  },
  time: {
    fontSize: 12,
    marginLeft: 8,
  },
  messageContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  lastMessage: {
    fontSize: 14,
    flex: 1,
  },
  typingText: {
    fontSize: 14,
    fontStyle: 'italic',
    flex: 1,
  },
  unreadBadge: {
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    marginLeft: 8,
  },
  unreadText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
});

export default ChatItem;