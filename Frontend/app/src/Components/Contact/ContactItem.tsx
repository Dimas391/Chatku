import React from 'react';
import { View, Text, TouchableOpacity, Image, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useTheme } from '@/app/src/context/ThemeContext';
import { Contact } from '@/app/src/hooks/contact';
import { styles } from '@/app/src/utils/contact';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/src/Components/navigation/RootStackParamList';
import chatService from '@/app/src/services/chatService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

interface ContactItemProps {
  contact: Contact;
  onPress?: (contact: Contact) => void;
}

const getStatusColor = (status: Contact['status']) => {
  switch (status) {
    case 'online': return '#4CAF50';
    case 'away': return '#FFA500';
    default: return '#888';
  }
};

const formatLastSeen = (lastSeen?: string): string => {
  if (!lastSeen) return 'Offline';
  
  try {
    const date = new Date(lastSeen);
    if (isNaN(date.getTime())) return 'Offline';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) {
      return 'Baru saja';
    } else if (diffMins < 60) {
      return `${diffMins} menit lalu`;
    } else if (diffHours < 24) {
      return `${diffHours} jam lalu`;
    } else if (diffDays === 1) {
      return 'Kemarin';
    } else if (diffDays < 7) {
      return `${diffDays} hari lalu`;
    } else {
      return `${date.getDate()} ${date.toLocaleString('id', { month: 'short' })} ${date.getFullYear()}`;
    }
  } catch (error) {
    return 'Offline';
  }
};

const getStatusText = (status: Contact['status'], lastSeen?: string) => {
  switch (status) {
    case 'online': return 'Online';
    case 'away': return 'Away';
    default: return formatLastSeen(lastSeen);
  }
};

export const ContactItem: React.FC<ContactItemProps> = ({ contact, onPress }) => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const statusColor = getStatusColor(contact.status);
  const statusText = getStatusText(contact.status, contact.lastSeen);

  const handlePress = () => {
    if (onPress) {
      onPress(contact);
    } else {
      handleChatPress();
    }
  };

  const handleChatPress = async () => {
    try {
      
      // Ambil daftar chat yang sudah ada
      const chatsResponse = await chatService.getChats();
      
      if (chatsResponse.success && chatsResponse.data) {
        const chats = chatsResponse.data.chats || [];
        
        // Cari chat yang participantnya termasuk user ID contact
        const existingChat = chats.find((chat: any) => {
          const participants = chat.participants || [];
          return participants.includes(contact.id);
        });
        
        if (existingChat) {
          // Gunakan chat yang sudah ada
          navigation.navigate('ChatDetailScreen' as any, {
            chatId: existingChat.id,
            chatName: contact.name,
            chatAvatar: contact.avatar || '',
            online: contact.status === 'online',
          });
        } else {
          // Buat chat baru menggunakan createPersonalChat
          const newChatResponse = await chatService.createPersonalChat(contact.id);
          
          if (newChatResponse.success && newChatResponse.data) {
            navigation.navigate('ChatDetailScreen' as any, {
              chatId: newChatResponse.data.id,
              chatName: contact.name,
              chatAvatar: contact.avatar || '',
              online: contact.status === 'online',
            });
          } else {
            Alert.alert('Error', newChatResponse.error || 'Gagal membuat chat');
          }
        }
      } else {
        Alert.alert('Error', 'Gagal mendapatkan daftar chat');
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat memulai chat');
    }
  };

  return (
    <TouchableOpacity
      style={[styles.contactItem, { backgroundColor: colors.card, borderBottomColor: colors.border }]}
      onPress={handlePress}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {contact.avatar ? (
          <Image source={{ uri: contact.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: '#FF6B3520' }]}>
            <Text style={styles.avatarText}>{contact.name.charAt(0)}</Text>
          </View>
        )}
        <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      </View>

      <View style={styles.contactInfo}>
        <View style={styles.contactHeader}>
          <Text style={[styles.contactName, { color: colors.text }]}>
            {contact.name}
          </Text>
          {!!contact.isVerified && (
            <MaterialCommunityIcons name="check-decagram" size={14} color="#2196F3" />
          )}
        </View>
        
        <View style={styles.contactMeta}>
          <Text style={[styles.contactStatus, { color: statusColor }]}>
            {statusText}
          </Text>
          {!!contact.mutualFriends && contact.mutualFriends > 0 && (
            <>
              <Text style={[styles.metaSeparator, { color: colors.textSecondary }]}>•</Text>
              <Text style={[styles.mutualFriends, { color: colors.textSecondary }]}>
                {contact.mutualFriends} mutual friends
              </Text>
            </>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.chatButton, { backgroundColor: '#FF6B3520' }]}
        onPress={handleChatPress}
      >
        <MaterialCommunityIcons name="chat" size={20} color="#FF6B35" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};