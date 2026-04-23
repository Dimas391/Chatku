import { useState, useCallback } from 'react';
import { CallHistoryItem } from './Calls';
import callService from '@/app/src/services/callService';
import videoCallService from '@/app/src/services/videoCallService';
import storageService from '@/app/src/services/storageService';
import { formatChatTime } from '@/app/src/utils/dateUtils'; 

export const useCallHistory = () => {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [calls, setCalls] = useState<CallHistoryItem[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const getCurrentUserId = async () => {
    try {
      let userId = await storageService.getUserId();
      if (!userId) {
        const userProfile = await storageService.getUserProfile();
        if (userProfile) {
          userId = userProfile.id || userProfile._id || userProfile.userId;
        }
      }
      return userId;
    } catch (error) {
      return null;
    }
  };

  const loadCallHistory = useCallback(async () => {
    try {
      setLoading(true);
      const userId = await getCurrentUserId();
      setCurrentUserId(userId);
      
      const response = await callService.getCallHistory(0, 50);
      
      if (response.success && response.data) {
        const callsData = response.data.calls || [];
        
        const formattedCalls: CallHistoryItem[] = callsData.map((call: any) => {
          const isCaller = call.caller_id === userId;
          
          let contactName = isCaller ? call.callee_name : call.caller_name;
          if (!contactName || contactName === 'Pengguna' || contactName === 'null') {
            const contactId = isCaller ? call.callee_id : call.caller_id;
            contactName = contactId?.slice(-6) || 'Unknown';
          }
          
          const contactAvatar = isCaller ? call.callee_avatar : call.caller_avatar;
          
          let status: 'missed' | 'answered' | 'outgoing' = 'answered';
          if (call.state === 'missed') status = 'missed';
          else if (call.state === 'declined') status = 'outgoing';
          else if (call.state === 'ended') status = 'answered';
          
          let isoDate = call.created_at;
          if (isoDate && !isoDate.includes('Z') && !isoDate.includes('+')) {
            isoDate = `${isoDate}Z`;
          }
          const timeString = formatChatTime(isoDate);
          
          let durationString = undefined;
          if (call.duration_seconds && call.duration_seconds > 0) {
            const minutes = Math.floor(call.duration_seconds / 60);
            const seconds = call.duration_seconds % 60;
            durationString = `${minutes}:${seconds.toString().padStart(2, '0')}`;
          }
          
          return {
            id: call.call_id,
            name: contactName,
            avatar: contactAvatar,
            type: call.type === 'video' ? 'video' : 'audio',
            status: status,
            time: timeString || '--:--',
            duration: durationString,
            timestamp: call.created_at ? new Date(call.created_at).getTime() : Date.now(),
            callId: call.call_id,
            chatId: call.chat_id,
            userId: isCaller ? call.callee_id : call.caller_id,
          };
        });
        
        setCalls(formattedCalls);
      } else {
        setCalls([]);
      }
    } catch (error) {
      setCalls([]);
    } finally {
      setLoading(false);
    }
  }, []);
  
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadCallHistory();
    setRefreshing(false);
  }, [loadCallHistory]);

  const deleteCall = useCallback(async (call: CallHistoryItem) => {
    
    try {
      // Delete dari backend berdasarkan tipe panggilan
      let deleteResponse;
      if (call.type === 'video') {
        deleteResponse = await videoCallService.deleteVideoCallHistory(call.id);
      } else {
        deleteResponse = await callService.deleteCallHistory(call.id);
      }
      
      if (deleteResponse.success) {
        // Hapus dari state lokal
        setCalls(prev => prev.filter(c => c.id !== call.id));
        return true;
      } else {
        return false;
      }
    } catch (error) {
      return false;
    }
  }, []);

  return {
    loading,
    refreshing,
    calls,
    currentUserId,
    loadCallHistory,
    onRefresh,
    deleteCall,
  };
};