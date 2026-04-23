import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import userService from '@/app/src/services/userService';
import chatService from '@/app/src/services/chatService';
import debounce from 'lodash/debounce';
import { UserProfile } from '@/app/src/services/userService';

type NewChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'NewChat'>;

export interface User extends UserProfile {
  // Extend dari UserProfile
}

export const useNewChat = () => {
  const navigation = useNavigation<NewChatScreenNavigationProp>();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [recentChats, setRecentChats] = useState<User[]>([]);
  const [loadingRecent, setLoadingRecent] = useState(true);
  const [contacts, setContacts] = useState<User[]>([]);

  // Load contacts (daftar kontak user)
  useEffect(() => {
    loadContacts();
  }, []);

  // Load recent chats dari kontak
  useEffect(() => {
    if (contacts.length > 0) {
      // Ambil 5 kontak teratas sebagai recent chats
      setRecentChats(contacts.slice(0, 5));
      setLoadingRecent(false);
    } else {
      setLoadingRecent(false);
    }
  }, [contacts]);

  // Load kontak user
  const loadContacts = async () => {
    setLoadingRecent(true);
    try {
      const response = await userService.getContacts();
      
      if (response.success && response.data) {
        setContacts(response.data.contacts);
      } else {
        console.log('No contacts found or error:', response.error);
      }
    } catch (error) {
      console.error('Error loading contacts:', error);
    } finally {
      setLoadingRecent(false);
    }
  };

  // Debounced search
  const debouncedSearch = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const response = await userService.searchUsers(query);
        if (response.success && response.data) {
          setSearchResults(response.data.users);
        }
      } catch (error) {
        console.error('Search error:', error);
      } finally {
        setLoading(false);
      }
    }, 500),
    []
  );

  const handleSearchChange = (text: string) => {
    setSearchQuery(text);
    debouncedSearch(text);
  };

  const handleUserSelect = async (user: User) => {
    try {
      const response = await chatService.createPersonalChat(user.id);
      
      if (response.success && response.data) {
        navigation.replace('ChatDetailScreen', {
          chatId: response.data.id,
          chatName: user.display_name,
          chatAvatar: user.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.display_name)}&background=FF6B35&color=fff`,
          online: user.is_online || false,
        });
      } else {
        Alert.alert('Error', response.error || 'Gagal memulai chat');
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert('Error', 'Gagal memulai chat. Silakan coba lagi.');
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  return {
    // State
    searchQuery,
    searchResults,
    loading,
    recentChats,
    loadingRecent,
    
    // Functions
    handleSearchChange,
    handleUserSelect,
    handleBack,
    clearSearch,
  };
};