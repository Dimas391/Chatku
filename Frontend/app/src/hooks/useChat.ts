// hooks/useChat.ts
import { useState, useEffect, useCallback, useRef } from 'react';
import { Alert, AppState } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import chatService from '@/app/src/services/chatService';
import userService from '@/app/src/services/userService';
import storageService from '@/app/src/services/storageService';
import websocketService from '@/app/src/services/websocketService';
import { ChatItem, ChatTabType } from '@/app/src/hooks/types';
import { formatChatTime } from '@/app/src/utils/dateUtils';

type ChatScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Chat'>;

interface UserProfileData {
  id: string;
  username: string;
  display_name: string;
  avatar_url?: string | null;
  phone?: string;
  email?: string;
}

interface ChatData {
  id: string;
  type: string;
  name?: string;
  avatar_url?: string | null;
  participants?: string[];
  last_message_text?: string;
  last_message_at?: string;
  unread_count: number;
  created_at: string;
}

let isListenerRegistered = false;

export const useChat = () => {
  const navigation = useNavigation<ChatScreenNavigationProp>();
  
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatItem[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<ChatTabType>('Semua');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [userProfile, setUserProfile] = useState<{ 
    id: string;
    username: string; 
    displayName: string;
    avatar: string;
    phone?: string;
    email?: string;
  }>({
    id: '',
    username: 'Loading...',
    displayName: 'Loading...',
    avatar: 'https://ui-avatars.com/api/?name=Loading&background=FF6B35&color=fff',
  });

  const isMounted = useRef(true);
  const hasLoaded = useRef(false);
  const joinedChats = useRef<Set<string>>(new Set());
  const chatIdsSet = useRef<Set<string>>(new Set());

  useEffect(() => {
    loadUserProfileAndConnect();
    return () => {
      isMounted.current = false;
    };
  }, []);

  useFocusEffect(
    useCallback(() => {
      // Refresh profile data whenever screen is focused
      // (e.g. after returning from ProfileSetup)
      loadUserProfileAndConnect();
    }, [])
  );

  const loadUserProfileAndConnect = async () => {
    try {
      const token = await storageService.getAccessToken();
      if (!token) {
        navigation.replace('RegisterScreen');
        return;
      }

      const response = await userService.getMyProfile();
      
      if (response.success && response.data) {
        const userData = response.data as UserProfileData;
        const userId = userData.id;
        
        setCurrentUserId(userId);
        await storageService.saveUserId(userId);
        
        setUserProfile({
          id: userId,
          username: userData.username,
          displayName: userData.display_name,
          avatar: userData.avatar_url || `https://ui-avatars.com/api/?name=${encodeURIComponent(userData.display_name)}&background=FF6B35&color=fff`,
          phone: userData.phone,
          email: userData.email,
        });
        
        await websocketService.connect();
        setupWebSocketListeners();
        await loadChats();
      } else {
        navigation.replace('RegisterScreen');
      }
    } catch (error) {
    }
  };

  const joinAllChatRooms = useCallback((chatList: ChatItem[]) => {
    if (!websocketService.isConnected()) {
      return;
    }
    
    chatList.forEach(chat => {
      if (!joinedChats.current.has(chat.id)) {
        websocketService.joinChat(chat.id);
        joinedChats.current.add(chat.id);
      }
    });
  }, []);

  const setupWebSocketListeners = () => {
    if (isListenerRegistered) {
      return;
    }
    
    isListenerRegistered = true;
    
    websocketService.onNewMessage((messageData: any) => {
      if (messageData && messageData.chat_id) {
        if (!joinedChats.current.has(messageData.chat_id)) {
          websocketService.joinChat(messageData.chat_id);
          joinedChats.current.add(messageData.chat_id);
        }
        updateChatWithNewMessage(messageData);
      }
    });
    
    websocketService.onTyping((data: any) => {
      if (data && data.chat_id && data.user_id !== currentUserId) {
        updateChatTypingStatus(data.chat_id, data.user_id, data.is_typing);
      }
    });
    
    websocketService.onMessagesRead((data: any) => {
      if (data && data.chat_id) {
        updateChatReadStatus(data.chat_id);
      }
    });

    websocketService.onProfileUpdated((data: any) => {
      if (data && data.user_id) {
        updateUserProfileInChats(data.user_id, data);
        
        // Jika yang diupdate adalah profil saya sendiri, update state userProfile
        if (data.user_id === currentUserId) {
          setUserProfile(prev => ({
            ...prev,
            displayName: data.display_name || prev.displayName,
            avatar: data.avatar_url || prev.avatar,
            username: data.username || prev.username,
          }));
        }
      }
    });
    
    websocketService.onConnected(() => {
      if (chats.length > 0) {
        joinAllChatRooms(chats);
      }
    });
  };

  const updateChatWithNewMessage = (messageData: {
    chat_id: string;
    content?: string;
    created_at?: string;
    sender_id?: string;
  }) => {
    setChats(prevChats => {
      const existingIndex = prevChats.findIndex(chat => chat.id === messageData.chat_id);
      const formattedTime = formatTime(messageData.created_at || new Date().toISOString());
      const isFromMe = messageData.sender_id === currentUserId;

      if (existingIndex !== -1) {
        // Update chat yang sudah ada — pertahankan semua field lama, hanya update pesan & waktu
        const existing = prevChats[existingIndex];
        const updatedChat: ChatItem = {
          ...existing,
          lastMessage: messageData.content || 'Media',
          lastMessageTime: formattedTime,
          unreadCount: isFromMe ? existing.unreadCount : existing.unreadCount + 1,
          typing: false,
        };
        const updatedChats = [...prevChats];
        updatedChats[existingIndex] = updatedChat;
        // Pindahkan ke posisi teratas
        updatedChats.splice(existingIndex, 1);
        return [updatedChat, ...updatedChats];
      } else {
        // Chat baru — fetch detailnya dari server
        fetchAndJoinNewChat(messageData.chat_id);
        const placeholderChat: ChatItem = {
          id: messageData.chat_id,
          name: 'Loading...',
          avatar: '',
          lastMessage: messageData.content || 'Media',
          lastMessageTime: formattedTime,
          unreadCount: isFromMe ? 0 : 1,
          online: false,
          typing: false,
        };
        return [placeholderChat, ...prevChats];
      }
    });
  };

  const fetchAndJoinNewChat = async (chatId: string) => {
    try {
      const response = await chatService.getChats();
      if (response.success && response.data) {
        const chat = response.data.chats.find((c: ChatData) => c.id === chatId);
        if (chat && !joinedChats.current.has(chatId)) {
          websocketService.joinChat(chatId);
          joinedChats.current.add(chatId);
          updateChatDetails(chat);
        }
      }
    } catch (error) {
    }
  };

  const updateChatDetails = (chat: ChatData) => {
    setChats(prevChats => {
      if (prevChats.find(c => c.id === chat.id)) return prevChats;
      if (chatIdsSet.current.has(chat.id)) return prevChats;
      
      let chatName = chat.name;
      let chatAvatar = chat.avatar_url;
      
      if (chat.type === 'personal' && chat.participants) {
        const otherId = chat.participants.find(id => id !== currentUserId);
        if (otherId) {
          userService.getUserById(otherId).then(res => {
            if (res.success && res.data && isMounted.current) {
              const p = res.data as UserProfileData;
              setChats(prev => prev.map(c => 
                c.id === chat.id 
                  ? { ...c, name: p.display_name, avatar: p.avatar_url || c.avatar }
                  : c
              ));
            }
          });
        }
      }
      
      const newChat: ChatItem = {
        id: chat.id,
        name: chatName || 'Unknown',
        avatar: chatAvatar || '',
        lastMessage: chat.last_message_text || '',
        lastMessageTime: formatTime(chat.last_message_at),
        unreadCount: chat.unread_count,
        online: false,
        typing: false,
      };
      
      chatIdsSet.current.add(chat.id);
      return [newChat, ...prevChats];
    });
  };

  const updateChatTypingStatus = (chatId: string, userId: string, isTyping: boolean) => {
    if (userId === currentUserId) return;
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, typing: isTyping } : chat
    ));
  };

  const updateChatReadStatus = (chatId: string) => {
    setChats(prev => prev.map(chat => 
      chat.id === chatId ? { ...chat, unreadCount: 0 } : chat
    ));
  };

  const updateUserProfileInChats = (userId: string, profile: any) => {
    setChats(prev => prev.map(chat => {
      // Jika ini adalah chat personal dengan user yang profilnya update
      if (chat.id.includes(userId) || (chat.name && chat.name === profile.display_name)) {
        // Kita butuh cara pasti untuk tahu apakah chat ini milik userId tersebut
        // Untuk saat ini, kita bisa berasumsi jika ada yang update profil, 
        // kita coba update semua chat yang mungkin terkait.
        // Tapi cara terbaik adalah jika chat item menyimpan otherUserId.
      }
      
      // Update logic: cari chat yang merupakan personal chat dengan userId
      // Karena kita tidak menyimpan otherUserId di ChatItem, kita perlu 
      // pendekatan lain atau memodifikasi ChatItem.
      // Untuk sementara, kita update yang namanya cocok atau kita butuh fetch ulang?
      // Cara paling aman: update semua chat yang mengandung participant userId
      return chat;
    }));
    
    // Karena ChatItem tidak menyimpan otherUserId secara eksplisit, 
    // cara termudah adalah me-trigger reload chat atau update by name/avatar logic
    // Tapi kita bisa melakukan update cerdas jika kita simpan data mapping.
    
    // Mari kita coba update berdasarkan ID user jika kita simpan mappingnya.
    // Atau cara paling simpel: load ulang daftar chat agar data sinkron dengan server.
    loadChats();
  };

  const loadChats = useCallback(async () => {
    console.log('[useChat] loadChats started');
    setLoading(true);
    try {
      const response = await chatService.getChats();
      console.log('[useChat] chatService.getChats response success:', response.success);
      
      if (response.success && response.data) {
        console.log('[useChat] Chats found:', response.data.chats.length);
        chatIdsSet.current.clear();
        
        const transformedChats: ChatItem[] = await Promise.all(
          response.data.chats.map(async (chat: ChatData) => {
            let chatName = chat.name;
            let chatAvatar = chat.avatar_url;

            if (chat.type === 'personal' && chat.participants) {
              const otherId = chat.participants.find(id => id !== currentUserId);
              if (otherId) {
                const participantData = await userService.getUserById(otherId);
                if (participantData.success && participantData.data) {
                  const p = participantData.data as UserProfileData;
                  chatName = p.display_name;
                  chatAvatar = p.avatar_url || chatAvatar;
                }
              }
            }

            return {
              id: chat.id,
              name: chatName || 'Unknown',
              avatar: chatAvatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(chatName || 'User')}&background=FF6B35&color=fff`,
              lastMessage: chat.last_message_text || '',
              lastMessageTime: formatTime(chat.last_message_at),
              unreadCount: chat.unread_count,
              online: false,
              typing: false,
            };
          })
        );

        if (isMounted.current) {
          console.log('[useChat] Setting chats state, count:', transformedChats.length);
          setChats(transformedChats);
          setTimeout(() => joinAllChatRooms(transformedChats), 500);
        }
      } else {
        console.warn('[useChat] Failed to load chats:', response.message || response.error);
      }
    } catch (error) {
      console.error('[useChat] Error in loadChats:', error);
    } finally {
      if (isMounted.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [currentUserId, joinAllChatRooms]);

  const parseTimeToDate = (timeStr: string): Date => {
    // Coba parse sebagai ISO string
    try {
      const date = new Date(timeStr);
      if (!isNaN(date.getTime())) return date;
    } catch (e) {}
    
    // Jika format "HH:MM" (jam:menit) untuk hari ini
    if (timeStr.match(/^\d{2}:\d{2}$/)) {
      const [hours, minutes] = timeStr.split(':').map(Number);
      const date = new Date();
      date.setHours(hours, minutes, 0, 0);
      return date;
    }
    
    // Jika format "Kemarin"
    if (timeStr === 'Kemarin') {
      const date = new Date();
      date.setDate(date.getDate() - 1);
      date.setHours(0, 0, 0, 0);
      return date;
    }
    
    return new Date();
  };

  const filterChats = () => {
    let filtered = [...chats];
    if (searchQuery) {
      filtered = filtered.filter(chat =>
        chat.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    setFilteredChats(filtered);
  };

  useEffect(() => {
    filterChats();
  }, [chats, searchQuery]);

  const handleRefresh = () => {
    setRefreshing(true);
    loadChats();
  };

  // Hanya cari chat baru dari API, TIDAK overwrite data realtime yang sudah ada
  const syncNewChats = useCallback(async () => {
    if (!currentUserId) return;
    try {
      const response = await chatService.getChats();
      if (response.success && response.data) {
        const apiChats: ChatData[] = response.data.chats;
        // Cek apakah ada chat ID yang belum ada di local state
        const hasNewChat = apiChats.some((c: ChatData) => !chatIdsSet.current.has(c.id));
        if (hasNewChat) {
          // Ada chat baru → lakukan full reload
          await loadChats();
        }
        // Jika tidak ada chat baru → pertahankan state in-memory (hasil WebSocket tetap aman)
      }
    } catch (_) {}
  }, [currentUserId, loadChats]);

  const handleNewChat = () => {
    navigation.navigate('NewChat');
  };

  const handleDeleteChat = async (chatId: string) => {
    try {
      const response = await chatService.deleteChat(chatId);
      if (response.success) {
        setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
        chatIdsSet.current.delete(chatId);
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to delete chat:', error);
      return false;
    }
  };

 const formatTime = (isoString?: string): string => {
  if (!isoString) return '';
  return formatChatTime(isoString);
};

  useFocusEffect(
    useCallback(() => {
      // Reconnect WebSocket jika putus
      if (currentUserId && !websocketService.isConnected()) {
        websocketService.connect();
      }
      // Hanya sync chat baru, TIDAK overwrite data realtime
      syncNewChats();
    }, [currentUserId, syncNewChats])
  );

  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && currentUserId && !websocketService.isConnected()) {
        websocketService.connect();
      }
    });
    return () => subscription.remove();
  }, [currentUserId]);

  return {
    chats: filteredChats,
    searchQuery,
    setSearchQuery,
    activeTab,
    setActiveTab,
    loading,
    refreshing,
    userProfile,
    currentUserId,
    handleRefresh,
    handleNewChat,
    handleDeleteChat,
    loadChats,
  };
};