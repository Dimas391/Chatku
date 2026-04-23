import { useState, useRef, useEffect, useCallback } from 'react';
import { FlatList, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../App';
import chatService from '@/app/src/services/chatService';
import userService from '@/app/src/services/userService';
import websocketService from '@/app/src/services/websocketService';
import storageService from '@/app/src/services/storageService';
import callService from '@/app/src/services/callService';
import videoCallService from '@/app/src/services/videoCallService';

type ChatDetailScreenNavigationProp = NativeStackNavigationProp<RootStackParamList>;
type ChatDetailScreenRouteProp = RouteProp<RootStackParamList, 'ChatDetailScreen'>;

export interface Message {
  id: string;
  text: string;
  time: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  isMe: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

export const useChatDetail = () => {
  const navigation = useNavigation<ChatDetailScreenNavigationProp>();
  const route = useRoute<ChatDetailScreenRouteProp>();

  const { chatId = '', chatName = '', chatAvatar = '', online = false } = route.params || {};

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserId, setOtherUserId] = useState<string>('');

  const flatListRef = useRef<FlatList>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isMounted = useRef(true);
  const messageHandlerRef = useRef<((msg: any) => void) | null>(null);

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  useEffect(() => {
    getCurrentUser();
  }, []);

  useEffect(() => {
    if (currentUserId && chatId) {
      getOtherUserId();
    }
  }, [currentUserId, chatId]);

  useEffect(() => {
    if (currentUserId && chatId) {
      const setup = async () => {
        
        if (!websocketService.isConnected()) {
          await websocketService.connect();
        }
        
        websocketService.joinChat(chatId);
        
        setupMessageListener();
        await loadMessages();
        markMessagesAsRead();
      };
      setup();
    }
  }, [chatId, currentUserId]);

  const getOtherUserId = async () => {
    try {
      const response = await chatService.getChats();
      if (response.success && response.data) {
        const chat = response.data.chats.find((c: any) => c.id === chatId);
        if (chat && chat.participants) {
          const otherId = chat.participants.find((id: string) => id !== currentUserId);
          if (otherId) {
            setOtherUserId(otherId);
          }
        }
      }
    } catch (error) {
    }
  };
              
  const setupMessageListener = () => {
    const handler = (newMessage: any) => {
      
      if (newMessage && newMessage.chat_id === chatId && isMounted.current) {
        
        fetchSenderInfo(newMessage.sender_id).then(senderInfo => {
          const formatted: Message = {
            id: newMessage.id,
            text: newMessage.content || '',
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            senderId: newMessage.sender_id,
            senderName:
              newMessage.sender_id === currentUserId
                ? 'Anda'
                : senderInfo?.display_name || chatName,
            senderAvatar:
              newMessage.sender_id === currentUserId
                ? currentUser?.avatar_url
                : senderInfo?.avatar_url || chatAvatar,
            isMe: newMessage.sender_id === currentUserId,
            status: newMessage.status,
          };
          
          setMessages(prev => [...prev, formatted]);
          setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
        });
      }
    };
    
    websocketService.onNewMessage(handler);
    messageHandlerRef.current = handler;
  };

  const fetchSenderInfo = async (senderId: string) => {
    if (senderId === currentUserId) return null;
    try {
      const res = await userService.getUserById(senderId);
      if (res.success && res.data) return res.data;
    } catch (error) {
    }
    return null;
  };

  const getCurrentUser = async () => {
    try {
      const res = await userService.getMyProfile();
      if (res.success && res.data) {
        setCurrentUserId(res.data.id);
        setCurrentUser(res.data);
      } else {
        const token = await storageService.getAccessToken();
        if (!token) {
          Alert.alert('Sesi Berakhir', 'Silakan login kembali');
          navigation.replace('RegisterScreen' as any);
        }
      }
    } catch (error) {
    }
  };

  const loadMessages = async () => {
    setLoading(true);
    try {
      const res = await chatService.getMessages(chatId);
      if (res.success && res.data?.messages) {
        const senderIds = [...new Set(res.data.messages.map((msg: any) => msg.sender_id))];
        const senderDetails: Record<string, any> = {};

        for (const id of senderIds) {
          if (id !== currentUserId) {
            const userRes = await userService.getUserById(id as string);
            if (userRes.success && userRes.data) {
              senderDetails[id as string] = userRes.data;
            }
          }
        }

        const formatted = res.data.messages.map((msg: any) => {
          const date = new Date(msg.created_at);
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          const isMe = msg.sender_id === currentUserId;
          return {
            id: msg.id,
            text: msg.content || '',
            time: `${hours}:${minutes}`,
            senderId: msg.sender_id,
            senderName: isMe ? 'Anda' : senderDetails[msg.sender_id]?.display_name || chatName,
            senderAvatar: isMe
              ? currentUser?.avatar_url
              : senderDetails[msg.sender_id]?.avatar_url || chatAvatar,
            isMe,
            status: msg.status,
          };
        });

        if (isMounted.current) setMessages(formatted);
      }
    } catch (error) {
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await chatService.markAsRead(chatId);
      websocketService.markAsRead(chatId);
    } catch (error) {}
  };

  const handleSend = useCallback(async () => {
    if (message.trim().length === 0) return;

    const tempId = Date.now().toString();
    const newMessage: Message = {
      id: tempId,
      text: message,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      senderId: currentUserId,
      senderName: 'Anda',
      senderAvatar: currentUser?.avatar_url,
      isMe: true,
      status: 'sent',
    };

    setMessages(prev => [...prev, newMessage]);
    setMessage('');
    setSending(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const res = await chatService.sendMessage(chatId, message);
      if (res.success && res.data && res.data.id) {
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId ? { ...msg, id: res.data!.id, status: 'delivered' } : msg
          )
        );
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        Alert.alert('Error', res.error || 'Gagal mengirim pesan');
      }
    } catch (error) {
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      Alert.alert('Error', 'Gagal mengirim pesan');
    } finally {
      setSending(false);
    }
  }, [message, chatId, currentUserId, currentUser]);

  const handleTyping = useCallback(
    (text: string) => {
      setMessage(text);
      if (websocketService.isConnected()) {
        websocketService.sendTyping(chatId, text.length > 0);
      }
    },
    [chatId]
  );

  const handleBack = useCallback(() => {
    navigation.goBack();
  }, [navigation]);

  const handleAttach = () => Alert.alert('Info', 'Fitur lampiran akan segera tersedia');

 const handleCall = useCallback(async () => {
  
  if (!otherUserId) {
    Alert.alert('Error', 'ID pengguna tidak ditemukan');
    return;
  }

  try {
    const response = await callService.initiateCall({
      callee_id: otherUserId,
      type: 'audio',
      chat_id: chatId,
    });

    if (response.success && response.data && response.data.call_id) {
      navigation.navigate('VoiceCall', {
        callId: response.data.call_id,
        chatId: chatId,
        callerName: chatName,
        callerAvatar: chatAvatar,
        isIncoming: false,
        calleeId: otherUserId,
        callerId: currentUserId,
      });
    } else {
      Alert.alert('Gagal Memanggil', response.error || 'Gagal memulai panggilan audio');
    }
  } catch (error: any) {
    Alert.alert(
      'Gagal Memanggil',
      error.response?.data?.detail || error.message || 'Gagal memulai panggilan audio'
    );
  }
}, [otherUserId, chatId, chatName, chatAvatar, currentUserId, navigation]);

  const handleVideoCall = useCallback(async () => {
  
  if (!otherUserId) {
    Alert.alert('Error', 'ID pengguna tidak ditemukan');
    return;
  }

  try {
    const response = await videoCallService.initiateVideoCall({
      callee_id: otherUserId,
      chat_id: chatId,
    });

    navigation.navigate('VideoCall', {
      callId: response.call_id,
      chatId: chatId,
      callerName: chatName,
      callerAvatar: chatAvatar,
      isIncoming: false,
      calleeId: otherUserId,
      callerId: currentUserId,
    });
  } catch (error: any) {
    Alert.alert('Gagal Memanggil', error.response?.data?.detail || 'Gagal memulai panggilan video');
  }
}, [otherUserId, chatId, chatName, chatAvatar, currentUserId, navigation]);

  

  return {
    chatId,
    chatName,
    chatAvatar, 
    online,
    message,
    messages,
    loading,
    sending,
    isTyping,
    flatListRef,
    currentUserId,
    currentUser,
    otherUserId,
    setMessage: handleTyping,
    handleSend,
    handleBack,
    handleAttach,
    handleCall,
    handleVideoCall,
  };
};