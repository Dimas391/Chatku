import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  Platform,
  AppState,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useChatDetail } from '@/app/src/hooks/UseDetailChat';
import { useDimensions } from '@/app/src/utils/dimensions';
import { BaseScreen } from '@/app/src/Components/BaseScreen';
import ChatDetailHeader from '@/app/src/Components/ChatDetail/ChatDetailHeader';
import MessageList from '@/app/src/Components/ChatDetail/MessageList';
import MessageInput from '@/app/src/Components/ChatDetail/MessageInput';  
import { useProfile } from '@/app/src/hooks/useProfile1';
import websocketService from '@/app/src/services/websocketService';
import storageService from '@/app/src/services/storageService';
import * as Notifications from 'expo-notifications';

const ChatDetailScreen = () => {
  const { notifMessages } = useProfile();
  const { DIMENSIONS } = useDimensions();
  const insets = useSafeAreaInsets();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [appState, setAppState] = useState(AppState.currentState);

  const {
    chatId,
    chatName,
    chatAvatar,
    online,
    message,
    messages,
    isTyping,
    flatListRef,
    setMessage,
    handleSend,
    handleBack,
  } = useChatDetail();

  // ✅ 1. Fix: Tambahkan handleAttach
  const handleAttach = useCallback(() => {
    Alert.alert('Info', 'Fitur lampiran akan segera tersedia');
  }, []);

  // Ambil current user ID
  useEffect(() => {
    const getUserId = async () => {
      const userId = await storageService.getUserId();
      setCurrentUserId(userId);
    };
    getUserId();
  }, []);

  // Monitor app state (foreground/background)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      setAppState(nextAppState);
    });
    return () => subscription.remove();
  }, []);

  useEffect(() => {
    console.log('🎬 [CHAT FEATURE] Component mounted, chatId:', chatId);
    console.log('🎬 [CHAT FEATURE] Current messages count:', messages.length);
    
    return () => {
      console.log('🎬 [CHAT FEATURE] Component unmounted, chatId:', chatId);
    };
  }, [chatId, messages.length]);

  useEffect(() => {
    console.log('[CHAT FEATURE] Messages updated, count:', messages.length);
    console.log('[CHAT FEATURE] Messages sample:', messages.slice(-3));
  }, [messages]);

  const handleNewMessage = useCallback(async (newMessage: any) => {
    console.log('New message received:', newMessage);
    console.log('notifMessages value:', notifMessages);
    console.log('isMe:', newMessage.isMe);
    
    if (newMessage.isMe === false && notifMessages === true) {
      console.log('📱 Sending message notification...');
      
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: `Pesan dari ${newMessage.senderName || chatName}`,
            body: newMessage.text || 'Mengirim pesan',
            data: { chat_id: chatId, type: 'message' },
            sound: true,
            priority: Notifications.AndroidNotificationPriority.HIGH,
          },
          trigger: null,
        });
        console.log('Message notification sent successfully');
      } catch (error) {
        console.error('❌ Failed to send notification:', error);
      }
    } else {
      console.log('🔕 Notification NOT sent. Condition not met.');
    }
  }, [notifMessages, chatId, chatName]);

  const styles = createStyles(DIMENSIONS, insets);

  return (
    <BaseScreen>
      <View style={styles.container}>
        <StatusBar
          barStyle="dark-content"
          backgroundColor="#FFFFFF"
          translucent={false}
        />

        <KeyboardAvoidingView
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? insets.top : 1}
        >
          <View style={styles.safeArea}>
            <View style={styles.contentContainer}>
              <ChatDetailHeader
                chatName={chatName}
                chatAvatar={chatAvatar}
                online={online}
                onBackPress={handleBack} onMenuPress={function (): void {
                  throw new Error('Function not implemented.');
                } }              />

              <MessageList
                messages={messages}
                chatAvatar={chatAvatar}
                flatListRef={flatListRef}
                isTyping={isTyping}
              />

              <MessageInput
                value={message}
                onChangeText={setMessage}
                onSend={handleSend}
                onAttach={handleAttach}
                isTyping={isTyping}
              />
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </BaseScreen>
  );
};

const createStyles = (
  DIMENSIONS: ReturnType<typeof useDimensions>['DIMENSIONS'],
  insets: { top: number; bottom: number; left: number; right: number }
) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: insets.top,
      paddingBottom: insets.bottom,
    },
    keyboardView: {
      flex: 1,
    },
    safeArea: {
      flex: 1,
    },
    contentContainer: {
      flex: 1,
      width: '100%',
      alignSelf: 'center',
    },
  });

export default ChatDetailScreen;