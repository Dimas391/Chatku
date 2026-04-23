import { useEffect, useRef, useState } from 'react';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import websocketService from '@/app/src/services/websocketService';
import storageService from '@/app/src/services/storageService';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export const useIncomingCall = () => {
  const navigation = useNavigation<Nav>();
  const activeCallId = useRef<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  // Ambil current user ID saat mount
  useEffect(() => {
    const getCurrentUserId = async () => {
      try {
        const userId = await storageService.getUserId();
        setCurrentUserId(userId);
      } catch (error) {
      }
    };
    getCurrentUserId();
  }, []);

  useEffect(() => {
    const handleIncomingCall = (data: any) => {
      if (currentUserId && data?.caller_id === currentUserId) {
        return;
      }

      // Hindari duplikasi notifikasi untuk call yang sama
      if (activeCallId.current === data?.call_id) {
        return;
      }
      activeCallId.current = data?.call_id;

      const callId    = data?.call_id    || '';
      const chatId    = data?.chat_id    || '';
      const callType  = data?.type       || 'audio';
      const callerName   = data?.caller_name   || 'Pengguna';
      const callerAvatar = data?.caller_avatar ||
        `https://ui-avatars.com/api/?name=${encodeURIComponent(callerName)}&background=FF6B35&color=fff`;
      const callerId  = data?.caller_id  || '';

      if (!callId) {
        return;
      }

      if (callType === 'video') {
        // Navigasi ke VideoCallScreen dengan status ringing
        navigation.navigate('VideoCall', {
          callId,
          chatId,
          callerName,
          callerAvatar,
          isIncoming: true,
          callerId,
          calleeId: '',
        } as any);
      } else {
        // Audio call → VoiceCallScreen
        navigation.navigate('VoiceCall', {
          callId,
          chatId,
          callerName,
          callerAvatar,
          isIncoming: true,
          callerId,
          calleeId: '',
        });
      }
    };

    const handleCallEnded = (data: any) => {
      // Reset tracker saat call berakhir
      if (data?.call_id === activeCallId.current) {
        activeCallId.current = null;
      }
    };

    const handleCallDeclined = (data: any) => {
      // Reset tracker saat call ditolak
      if (data?.call_id === activeCallId.current) {
        activeCallId.current = null;
      }
    };

    websocketService.on('incoming_call', handleIncomingCall);
    websocketService.on('call_ended',    handleCallEnded);
    websocketService.on('call_declined', handleCallDeclined);

    return () => {
      websocketService.off('incoming_call', handleIncomingCall);
      websocketService.off('call_ended',    handleCallEnded);
      websocketService.off('call_declined', handleCallDeclined);
    };
  }, [navigation, currentUserId]);
};