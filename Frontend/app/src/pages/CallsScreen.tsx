import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useLanguage } from '@/app/src/context/LanguageContext';
import { BaseScreen } from '@/app/src/Components/BaseScreen';
import { RootStackParamList } from '@/app/src/Components/navigation/RootStackParamList';

// Import komponen-komponen
import { CallItem } from '@/app/src/Components/call/CallItem';
import { CallStats } from '@/app/src/Components/call/CallStats';
import { EmptyState } from '@/app/src/Components/call/EmptyState';
import { useCallHistory } from '@/app/src/hooks/useCallHistory';
import { CallHistoryItem } from '@/app/src/hooks/Calls';
import callService from '@/app/src/services/callService';
import videoCallService from '@/app/src/services/videoCallService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const CallsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  const { t } = useLanguage();
  
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCall, setSelectedCall] = useState<CallHistoryItem | null>(null);
  const [deleteModalVisible, setDeleteModalVisible] = useState(false);
  
  const {
    loading,
    refreshing,
    calls,
    currentUserId,
    loadCallHistory,
    onRefresh,
    deleteCall, 
  } = useCallHistory();

  useFocusEffect(
    useCallback(() => {
      loadCallHistory();
    }, [loadCallHistory])
  );

  // Handle call press - melakukan panggilan ulang
  const handleCallPress = async (item: CallHistoryItem) => {
    try {
      if (item.type === 'video') {
        const response = await videoCallService.initiateVideoCall({
          callee_id: item.userId || item.id,
          chat_id: item.chatId || `chat_${item.id}`,
        });
        
        if (response.success && response.data) {
          navigation.navigate('VideoCall', {
            callId: response.data.call_id,
            chatId: item.chatId || `chat_${item.id}`,
            callerId: currentUserId || '',
            calleeId: item.userId || item.id,
            callerName: item.name,
            callerAvatar: item.avatar || '',
            isIncoming: false,
          });
        } else {
          Alert.alert('Error', response.error || 'Gagal memulai panggilan video');
        }
      } else {
        const response = await callService.initiateCall({
          callee_id: item.userId || item.id,
          type: 'audio',
          chat_id: item.chatId || `chat_${item.id}`,
        });
        
        if (response.success && response.data) {
          navigation.navigate('VoiceCall', {
            callId: response.data.call_id,
            chatId: item.chatId || `chat_${item.id}`,
            callerId: currentUserId || '',
            calleeId: item.userId || item.id,
            callerName: item.name,
            callerAvatar: item.avatar || '',
            isIncoming: false,
          });
        } else {
          Alert.alert('Error', response.error || 'Gagal memulai panggilan');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat memulai panggilan');
    }
  };

  const handleDeleteCall = (item: CallHistoryItem) => {
    setSelectedCall(item);
    setDeleteModalVisible(true);
  };

  const confirmDelete = async () => {
  if (!selectedCall) return;
  
  setIsDeleting(true);
  
  try {
    const success = await deleteCall(selectedCall);
    
    if (success) {
      setDeleteModalVisible(false);
      setSelectedCall(null);
    } else {
      Alert.alert('Error', 'Gagal menghapus riwayat panggilan');
    }
  } catch (error) {
    Alert.alert('Error', 'Gagal menghapus riwayat panggilan');
  } finally {
    setIsDeleting(false);
  }
};

  const handleDeleteAll = () => {
    Alert.alert(
      'Hapus Semua',
      'Apakah Anda yakin ingin menghapus semua riwayat panggilan?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus Semua', 
          style: 'destructive',
          onPress: async () => {
            try {
              // Hapus semua dari state lokal
              for (const call of calls) {
                await deleteCall(call);
              }
            } catch (error) {
              Alert.alert('Error', 'Gagal menghapus riwayat panggilan');
            }
          }
        },
      ]
    );
  };

  // Handle start new call from empty state
  const handleStartCall = () => {
    navigation.navigate('Contacts' as never);
  };

  // Handle menu press (3 dots)
  const handleMenuPress = () => {
    Alert.alert('Menu', 'Pilih opsi', [
      { 
        text: 'Hapus Semua Riwayat', 
        onPress: handleDeleteAll
      },
      { text: 'Pengaturan', onPress: () => navigation.navigate('Settigs' as never) },
      { text: 'Batal', style: 'cancel' },
    ]);
  };

  // Hitung statistik
  const missedCalls = calls.filter(call => call.status === 'missed').length;
  const totalCalls = calls.length;
  const videoCalls = calls.filter(c => c.type === 'video').length;

  // Render delete confirmation modal
  const renderDeleteModal = () => (
    <Modal
      visible={deleteModalVisible}
      transparent
      animationType="fade"
      onRequestClose={() => setDeleteModalVisible(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalCard, { backgroundColor: colors.card }]}>
          <View style={styles.modalHandle} />
          <MaterialCommunityIcons name="phone-remove" size={48} color="#FF4444" style={styles.modalIcon} />
          <Text style={[styles.modalTitle, { color: colors.text }]}>Hapus Riwayat</Text>
          <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
            Apakah Anda yakin ingin menghapus riwayat panggilan dengan {selectedCall?.name}?
          </Text>
          <View style={styles.modalButtons}>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalCancelButton]} 
              onPress={() => setDeleteModalVisible(false)}
            >
              <Text style={styles.modalCancelText}>Batal</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalButton, styles.modalDeleteButton]} 
              onPress={confirmDelete}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <Text style={styles.modalDeleteText}>Hapus</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  // Tampilkan loading state
  if (loading) {
    return (
      <BaseScreen>
        <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Memuat riwayat panggilan...
          </Text>
        </View>
      </BaseScreen>
    );
  }

  return (
    <BaseScreen>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <CallStats
          totalCalls={totalCalls}
          missedCalls={missedCalls}
          videoCalls={videoCalls}
          onMenuPress={handleMenuPress}
        />
        
        {calls.length === 0 ? (
          <EmptyState onStartCall={handleStartCall} />
        ) : (
          <FlatList
            data={calls}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <CallItem
                item={item}
                onPress={handleCallPress}
                onLongPress={() => handleDeleteCall(item)}
              />
            )}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#FF6B35"
                colors={['#FF6B35']}
              />
            }
            contentContainerStyle={styles.listContent}
          />
        )}
      </View>
      
      {renderDeleteModal()}
    </BaseScreen>
  );
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 20,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalCard: {
    width: '80%',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#ddd',
    borderRadius: 2,
    marginBottom: 20,
  },
  modalIcon: {
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  modalCancelButton: {
    backgroundColor: '#f0f0f0',
  },
  modalDeleteButton: {
    backgroundColor: '#FF4444',
  },
  modalCancelText: {
    color: '#333',
    fontWeight: '600',
  },
  modalDeleteText: {
    color: '#fff',
    fontWeight: '600',
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 16,
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#FF6B35',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default CallsScreen;