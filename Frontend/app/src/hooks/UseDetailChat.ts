import { useState, useRef, useEffect, useCallback } from 'react';
import { FlatList, Alert, Platform } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { RootStackParamList } from '../../../App';
import chatService from '@/app/src/services/chatService';
import userService from '@/app/src/services/userService';
import authService from '@/app/src/services/authService';
import websocketService from '@/app/src/services/websocketService';
import storageService from '@/app/src/services/storageService';
import callService from '@/app/src/services/callService';
import videoCallService from '@/app/src/services/videoCallService';
import encryptionService from '@/app/src/services/encryptionService';
import clientClassificationService from '@/app/src/services/clientClassificationService';
import { BASE_URL } from '@/app/src/config/api';

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
  status?: 'sent' | 'delivered' | 'read' | 'sending';
  classificationLabel?: 'Berisiko' | 'Tidak Berisiko' | null;
  isDestroyed?: boolean;  
  isRisky?: boolean;
  isVerified?: boolean;
  confidence?: number;
  date?: string; // ISO format or YYYY-MM-DD
}

export const useChatDetail = () => {
  const navigation = useNavigation<ChatDetailScreenNavigationProp>();
  const route = useRoute<ChatDetailScreenRouteProp>();

  const { chatId = '', chatName = '', chatAvatar = '', online = false } = route.params || {};

  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentChatName, setCurrentChatName] = useState(chatName);
  const [currentChatAvatar, setCurrentChatAvatar] = useState(chatAvatar);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isTyping, setIsTyping] = useState(false);
  const [otherUserId, setOtherUserId] = useState<string>('');
  const [recipientPublicKey, setRecipientPublicKey] = useState<string | null>(null);

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

  // Get recipient's public key for dual encryption
  const getRecipientPublicKey = useCallback(async (userId: string) => {
    try {
      const response = await userService.getUserPublicKey(userId);
      if (response.success && response.data?.public_key) {
        const data = response.data;
        setRecipientPublicKey(data.public_key);
        return data.public_key;
      }
      console.error('Failed to get recipient public key');
      return null;
    } catch (error) {
      console.error('Error getting recipient public key:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    if (otherUserId) {
      getRecipientPublicKey(otherUserId);
    }
  }, [otherUserId, getRecipientPublicKey]);

  useEffect(() => {
    if (currentUserId && chatId) {
      const setup = async () => {
        setLoading(true);
        
        // 1. Connect WebSocket
        if (!websocketService.isConnected()) {
          await websocketService.connect();
        }
        websocketService.joinChat(chatId);
        setupMessageListener();
        
        // Listen for profile updates to refresh header
        const profileUpdateHandler = (data: any) => {
          if (data && data.user_id === otherUserId) {
            if (data.display_name) setCurrentChatName(data.display_name);
            if (data.avatar_url) setCurrentChatAvatar(data.avatar_url);
          }
        };
        websocketService.onProfileUpdated(profileUpdateHandler);
        
        // 2. Load Messages
        await loadMessages();
        markMessagesAsRead();
        
        return () => {
          websocketService.off('profile_updated', profileUpdateHandler);
        };
      };
      setup();
    }
  }, [chatId, currentUserId, otherUserId]);

  const getOtherUserId = async () => {
    try {
      const response = await chatService.getChats();
      if (response.success && response.data?.chats) {
        const data = response.data;
        const chat = data.chats.find((c: any) => c.id === chatId);
        if (chat && chat.participants) {
          const otherId = chat.participants.find((id: string) => id !== currentUserId);
          if (otherId) {
            setOtherUserId(otherId);
            console.log('👤 [CHAT] Other user ID:', otherId);
          }
        }
      }
    } catch (error) {}
  };

  const fetchSenderInfo = async (senderId: string) => {
    if (senderId === currentUserId) return null;
    try {
      const res = await userService.getUserById(senderId);
      if (res.success && res.data) {
        return res.data;
      }
    } catch (error) {}
    return null;
  };

  // Setup message listener with dual decryption
  const setupMessageListener = () => {
  console.log('🔌 [WEBSOCKET] Setting up message listener for chat:', chatId);
  
  const handler = async (newMessage: any) => {
    console.log('🔌 [WEBSOCKET] New message received:', newMessage?.id);
    
    if (newMessage && newMessage.chat_id === chatId && isMounted.current) {
      
      let displayContent = '';
      let isDestroyed = newMessage.is_destroyed || newMessage.classification_label?.toLowerCase() === "berisiko";
      
      // Prioritaskan field dual-encryption (encrypted_content_user) lalu legacy (encrypted_content)
      const encryptedContent = newMessage.encrypted_content_user || newMessage.encrypted_content;
      let encryptedAesKey = null;
      const isMsgMe = newMessage.sender_id === currentUserId;
      if (isMsgMe && newMessage.encrypted_aes_key_sender) {
        encryptedAesKey = newMessage.encrypted_aes_key_sender;
      } else {
        encryptedAesKey = newMessage.encrypted_aes_key_user || newMessage.encrypted_aes_key;
      }

      console.log('🔌 [WEBSOCKET] encryptedContent:', !!encryptedContent, '| encryptedAesKey:', !!encryptedAesKey, '| isDestroyed:', isDestroyed);

      // 🔐 DECRYPT incoming message if it's encrypted
      if (encryptedContent && !isDestroyed) {
        try {
          const myPrivateKey = await encryptionService.getMyPrivateKey();
          
          if (!myPrivateKey) {
            console.error('🔐 [WEBSOCKET] No private key available');
            displayContent = '[Pesan terenkripsi - tidak ada kunci]';
          } else if (!encryptedAesKey) {
            console.error('🔐 [WEBSOCKET] No encrypted AES key available');
            displayContent = '[Pesan terenkripsi - kunci tidak ditemukan]';
          } else {
            const result = await encryptionService.decryptMessagePayload(
              encryptedContent,
              encryptedAesKey,
              newMessage.iv,
              newMessage.message_hash,
              myPrivateKey
            );
            displayContent = result.plaintext;
            console.log('🔐 [WEBSOCKET] Message decrypted successfully:', displayContent.substring(0, 30));
          }
        } catch (error) {
          console.error('🔐 [WEBSOCKET] Failed to decrypt:', error);
          displayContent = '[Pesan tidak dapat didekripsi]';
        }
      } else if (isDestroyed) {
        displayContent = '⚠️ [KONTEN BERBAHAYA TELAH DIHANCURKAN OLEH SISTEM] ⚠️';
      } else {
        displayContent = newMessage.content || '[Pesan kosong]';
      }

      // Ambil info sender terlebih dahulu (await di luar setMessages)
      const senderInfo = newMessage.sender_id !== currentUserId
        ? await fetchSenderInfo(newMessage.sender_id)
        : null;

      const formatted: Message = {
        id: newMessage.id,
        text: displayContent,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        senderId: newMessage.sender_id,
        senderName: newMessage.sender_id === currentUserId
          ? 'Anda'
          : newMessage.sender_name || senderInfo?.display_name || chatName,
        senderAvatar: newMessage.sender_id === currentUserId
          ? currentUser?.avatar_url
          : newMessage.sender_avatar || senderInfo?.avatar_url || chatAvatar,
        isMe: newMessage.sender_id === currentUserId,
        status: newMessage.status,
        classificationLabel: newMessage.classification_label,
        isDestroyed: isDestroyed,
        isVerified: newMessage.is_verified,
        date: new Date().toISOString(),
      };

      setMessages(currentMessages => {
        // Jika pesan sudah ada, update kontennya
        if (currentMessages.some(msg => msg.id === formatted.id)) {
          return currentMessages.map(msg => msg.id === formatted.id ? formatted : msg);
        }
        // Tambahkan pesan baru ke akhir list
        return [...currentMessages, formatted];
      });

      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  websocketService.onNewMessage(handler);
};

  const getCurrentUser = async () => {
    try {
      const res = await userService.getMyProfile();
      if (res.success && res.data) {
        const data = res.data;
        setCurrentUserId(data.id);
        setCurrentUser(data);
        console.log('👤 [USER] Current user:', data.id);
      } else {
        const token = await storageService.getAccessToken();
        if (!token) {
          Alert.alert('Sesi Berakhir', 'Silakan login kembali');
          navigation.replace('RegisterScreen' as any);
        }
      }
    } catch (error) {}
  };

  // Load messages with dual decryption
  const loadMessages = async () => {
    if (!isMounted.current) return;
    
    // console.log('📨 [LOAD] Loading messages for chat:', chatId);
    setLoading(true);
    try {
      const res = await chatService.getMessages(chatId);
      
      if (res.success && res.data?.messages) {
        // console.log('📨 [LOAD] Messages count:', res.data.messages.length);
        
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

        // Get private key for decryption
        const myPrivateKey = await encryptionService.getMyPrivateKey();
        
        const formatted = await Promise.all(res.data.messages.map(async (msg: any) => {
          const date = new Date(msg.created_at);
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          const isMe = msg.sender_id === currentUserId;
          
          let displayContent = '[Pesan kosong]';
          
          // Prioritaskan dual-encryption fields (encrypted_content_user) lalu legacy
          const encryptedContent = msg.encrypted_content_user || msg.encrypted_content;
          
          let encryptedAesKey = null;
          if (isMe && msg.encrypted_aes_key_sender) {
            encryptedAesKey = msg.encrypted_aes_key_sender;
          } else {
            encryptedAesKey = msg.encrypted_aes_key_user || msg.encrypted_aes_key;
          }

          // Try to decrypt if encrypted
          if (encryptedContent && encryptedAesKey && myPrivateKey) {
            try {
              // console.log(`🔐 [LOAD] Decrypting message ${msg.id}...`);
              const result = await encryptionService.decryptMessagePayload(
                encryptedContent,
                encryptedAesKey,
                msg.iv || '',
                msg.message_hash || '',
                myPrivateKey
              );
              displayContent = result.plaintext;
            } catch (error: any) {
              const errMsg = error?.message || "";
              // Pesan mungkin dienkripsi dengan kunci lama (beda perangkat/session)
              const isKeyMismatch = errMsg.includes('block') ||
                                    errMsg.includes('invalid') ||
                                    errMsg.includes('decrypt') ||
                                    errMsg.includes('PKCS_DECODING_ERROR') ||
                                    errMsg.includes('OPENSSL');
              // console.warn(`🔐 [LOAD] Cannot decrypt message ${msg.id}:`, errMsg);
              if (isMe) {
                displayContent = '[Pesan Anda (terenkripsi)]';
              } else {
                displayContent = isKeyMismatch
                  ? '[🔒 Pesan dari sesi lain - tidak dapat dibuka di perangkat ini]'
                  : '[Pesan terenkripsi]';
              }
            }
          } else if (msg.content) {
            displayContent = msg.content;
          }
          
          return {
            id: msg.id,
            text: displayContent,
            time: `${hours}:${minutes}`,
            senderId: msg.sender_id,
            senderName: isMe ? 'Anda' : senderDetails[msg.sender_id]?.display_name || chatName,
            senderAvatar: isMe
              ? currentUser?.avatar_url
              : senderDetails[msg.sender_id]?.avatar_url || chatAvatar,
            isMe,
            status: msg.status,
            classificationLabel: null,   // Klasifikasi dilakukan client-side sebelum kirim
            isDestroyed: false,          // Server tidak lagi menghancurkan pesan
            isVerified: msg.is_verified,
            date: msg.created_at,
          };
        }));
        
        // console.log('📨 [LOAD] Formatted messages count:', formatted.length);
        setMessages(formatted);
      } else {
        console.error('📨 [LOAD] Failed to load messages:', res.error);
      }
    } catch (error) {
      console.error('❌ [LOAD] Error loading messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const markMessagesAsRead = async () => {
    try {
      await chatService.markAsRead(chatId);
      websocketService.markAsRead(chatId);
    } catch (error) {}
  };

  /**
   * Fungsi internal untuk mengirim pesan yang sudah lolos klasifikasi.
   * Dipanggil langsung jika pesan aman, atau setelah user konfirmasi jika berisiko.
   */
  const _doSendMessage = useCallback(async (
    originalMessage: string,
    classificationLabel: 'Berisiko' | 'Tidak Berisiko',
    isRisky: boolean
  ) => {
    const tempId = Date.now().toString();

    try {
      // Ambil public key penerima
      const recipientPublicKey = await userService.getUserPublicKey(otherUserId);
      if (!recipientPublicKey || !recipientPublicKey.data?.public_key) {
        Alert.alert('Error', 'Tidak dapat mengambil kunci enkripsi penerima');
        return;
      }

      // Enkripsi pesan untuk penerima
      console.log('[SEND] Mengenkripsi pesan...');
      const encryptedData = await encryptionService.encryptMessage(
        originalMessage,
        recipientPublicKey.data.public_key
      );

      console.log('[SEND] Pesan berhasil dienkripsi');

      // Buat pesan sementara (optimistic UI)
      const newMessage: Message = {
        id: tempId,
        text: '[Mengirim...]',
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        senderId: currentUserId,
        senderName: 'Anda',
        senderAvatar: currentUser?.avatar_url,
        isMe: true,
        status: 'sending',
        isVerified: true,
        date: new Date().toISOString(),
      };

      setMessages(prev => [...prev, newMessage]);
      setSending(true);

      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

      // Kirim pesan terenkripsi ke server (sertakan label klasifikasi untuk forensic log)
      const res = await chatService.sendEncryptedMessage(chatId, encryptedData, classificationLabel);

      if (res.success && res.data) {
        console.log('[SEND] Pesan berhasil terkirim');

        // Perbarui pesan dengan konten aktual
        setMessages(prev =>
          prev.map(msg =>
            msg.id === tempId ? {
              ...msg,
              id: res.data!.message_id,
              status: 'delivered',
              text: originalMessage,
              classificationLabel: classificationLabel,
              isDestroyed: false,
              isRisky: isRisky,
              isVerified: res.data!.is_verified || true
            } : msg
          )
        );
      } else {
        setMessages(prev => prev.filter(msg => msg.id !== tempId));
        Alert.alert('Error', res.error || 'Gagal mengirim pesan');
      }
    } catch (error: any) {
      console.error('❌ [SEND] Error:', error);
      setMessages(prev => prev.filter(msg => msg.id !== tempId));
      Alert.alert('Error', 'Gagal mengirim pesan terenkripsi');
    } finally {
      setSending(false);
    }
  }, [chatId, currentUserId, currentUser, otherUserId]);

  const handleSend = useCallback(async () => {
    if (message.trim().length === 0) return;

    let originalMessage = message;
    console.log('📤 [SEND] Panjang pesan asli:', originalMessage.length);

    // Klasifikasi lokal (Client-side) menggunakan model Naive Bayes
    const classification = clientClassificationService.classify(originalMessage);
    const isRisky = classification.label === 'Berisiko';

    if (isRisky) {
       originalMessage = "Pesan terindikasi berisiko";
    }

    setMessage('');
    _doSendMessage(originalMessage, classification.label, isRisky);
  }, [message, _doSendMessage]);

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
      if (response.success && response.data) {
        const data = response.data;
        navigation.navigate('VoiceCall', {
          callId: data.call_id,
          chatId,
          callerName: chatName,
          callerAvatar: chatAvatar,
          isIncoming: false,
          calleeId: otherUserId,
          callerId: currentUserId,
        });
      } else {
        const errorMsg = typeof response.error === 'string' ? response.error : 'Gagal memulai panggilan audio';
        Alert.alert('Gagal Memanggil', errorMsg);
      }
    } catch (error: any) {
      Alert.alert('Gagal Memanggil', error.message || 'Gagal memulai panggilan audio');
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
      if (response.success && response.data) {
        const data = response.data;
        navigation.navigate('VideoCall', {
          callId: data.call_id,
          chatId,
          callerName: chatName,
          callerAvatar: chatAvatar,
          isIncoming: false,
          calleeId: otherUserId,
          callerId: currentUserId,
        });
      }
    } catch (error: any) {
      Alert.alert('Gagal Memanggil', error.message || 'Gagal memulai panggilan video');
    }
  }, [otherUserId, chatId, chatName, chatAvatar, currentUserId, navigation]);

  return {
    chatId,
    chatName: currentChatName,
    chatAvatar: currentChatAvatar,
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
    handleCall,
    handleVideoCall,
  };
};