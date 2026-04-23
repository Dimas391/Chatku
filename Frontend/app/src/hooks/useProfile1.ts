import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import { UserProfile, UserStatus } from '@/app/src/hooks/Profile';
import profileService from '@/app/src/services/profileService';
import chatService from '@/app/src/services/chatService';
import contactService from '@/app/src/services/contactService';
import storageService from '@/app/src/services/storageService';
import api from '../config/api';

interface NotificationSettings {
  messages: boolean;
  calls: boolean;
  groups: boolean;
}

export const useProfile = () => {
  const [profile, setProfile] = useState<UserProfile>({
    id: '',
    name: '',
    display_name: '',
    username: '',
    email: '',
    phone: '',
    bio: '',
    avatar: '',
    avatar_url: null,
    status: 'online',
    joinedAt: '',
    created_at: '',
    verified: false,
    is_verified: false,
  });

  const [loading, setLoading] = useState(true);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [messageCount, setMessageCount] = useState(0);
  const [contactCount, setContactCount] = useState(0);

  // Modal states
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [editField, setEditField] = useState<'name' | 'username' | 'bio' | 'phone' | null>(null);
  const [editValue, setEditValue] = useState('');

  // Notification & privacy toggles
  const [notifMessages, setNotifMessages] = useState(true);
  const [notifCalls, setNotifCalls] = useState(true);
  const [notifGroups, setNotifGroups] = useState(false);
  const [readReceipts, setReadReceipts] = useState(true);
  const [lastSeen, setLastSeen] = useState(true);
  const [twoFactor, setTwoFactor] = useState(true);
  const [biometric, setBiometric] = useState(true);

  const formatJoinDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      const monthNames = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember',
      ];
      return `${monthNames[date.getMonth()]} ${date.getFullYear()}`;
    } catch {
      return '2024';
    }
  };

  const authConfig = (token: string) => ({
    headers: { Authorization: `Bearer ${token}` },
  });

  const loadNotificationSettings = useCallback(async () => {
    try {
      const token = await storageService.getAccessToken();
      if (!token) return;

      const response = await api.get(
        '/users/me/notification-settings',
        authConfig(token),
      );

      const data = response.data as NotificationSettings;
      if (data) {
        setNotifMessages(data.messages ?? true);
        setNotifCalls(data.calls ?? true);
        setNotifGroups(data.groups ?? false);
      }
    } catch (error) {
    }
  }, []);

  const saveNotificationSettings = useCallback(
    async (type: keyof NotificationSettings, value: boolean) => {
      try {
        const token = await storageService.getAccessToken();
        if (!token) return;

        const updateData: Partial<NotificationSettings> = { [type]: value };

        await api.patch(
          '/users/me/notification-settings',
          updateData,
          authConfig(token),
        );

      } catch (error) {
      }
    },
    [],
  );

  const updateNotifMessages = useCallback(async (value: boolean) => {
    setNotifMessages(value);
    await saveNotificationSettings('messages', value);
  }, [saveNotificationSettings]);

  const updateNotifCalls = useCallback(async (value: boolean) => {
    setNotifCalls(value);
    await saveNotificationSettings('calls', value);
  }, [saveNotificationSettings]);

  const updateNotifGroups = useCallback(async (value: boolean) => {
    setNotifGroups(value);
    await saveNotificationSettings('groups', value);
  }, [saveNotificationSettings]);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);

      const profileResponse = await profileService.getMyProfile();
      if (profileResponse.success && profileResponse.data) {
        const userData = profileResponse.data;
        setProfile({
          id: userData.id,
          name: userData.display_name || userData.username,
          display_name: userData.display_name || '',
          username: userData.username,
          email: userData.email || '',
          phone: userData.phone || '',
          bio: userData.bio || '',
          avatar: userData.avatar_url || undefined,
          avatar_url: userData.avatar_url,
          status: 'online',
          joinedAt: formatJoinDate(userData.created_at),
          created_at: userData.created_at,
          verified: userData.is_verified,
          is_verified: userData.is_verified,
        });
      }

      // Hitung total pesan dari semua chat
      const chatsResponse = await chatService.getChats();
      if (chatsResponse.success && chatsResponse.data) {
        const chats: any[] = chatsResponse.data.chats || [];
        let totalMessages = 0;
        for (const chat of chats) {
          const msgResponse = await chatService.getMessages(chat.id, undefined, 1);
          if (msgResponse.success && msgResponse.data) {
            totalMessages += msgResponse.data.messages?.length ?? 0;
          }
        }
        setMessageCount(totalMessages);
      }

      // Hitung kontak
      const contactsResponse = await contactService.getContactsFromChats();
      if (contactsResponse.success && contactsResponse.data) {
        setContactCount(contactsResponse.data.length);
      }
    } catch (error) {
    } finally {
      setLoading(false);
    }
  }, []);

  //  Update field profil 
  const updateProfile = async (field: string, value: string): Promise<boolean> => {
    try {
      const response = await profileService.updateProfile({
        display_name: field === 'name'     ? value : profile.display_name,
        username:     field === 'username' ? value.toLowerCase().replace(/\s/g, '') : profile.username,
        bio:          field === 'bio'      ? value : profile.bio,
      });

      if (response.success && response.data) {
        setProfile(prev => ({
          ...prev,
          name:         field === 'name'     ? value : prev.name,
          display_name: field === 'name'     ? value : prev.display_name,
          username:     field === 'username' ? value.toLowerCase().replace(/\s/g, '') : prev.username,
          bio:          field === 'bio'      ? value : prev.bio,
          phone:        field === 'phone'    ? value : prev.phone,
        }));
        return true;
      }
      return false;
    } catch (error) {
      return false;
    }
  };

  // Buka modal edit 
  const openEditModal = (field: 'name' | 'username' | 'bio' | 'phone') => {
    setEditField(field);
    setEditValue(
      field === 'name'     ? profile.name     :
      field === 'username' ? profile.username :
      field === 'bio'      ? profile.bio      :
      profile.phone,
    );
    setEditModalVisible(true);
  };

  //  Simpan hasil edit 
  const saveEdit = async () => {
    if (!editField || !editValue.trim()) return;
    const success = await updateProfile(editField, editValue.trim());
    if (success) {
      setEditModalVisible(false);
      Alert.alert('Berhasil', 'Profil berhasil diperbarui');
    } else {
      Alert.alert('Error', 'Gagal memperbarui profil');
    }
  };

  // Update avatar 
  const updateAvatar = useCallback(async (avatarUri: string | null) => {
    try {
      setUploadingAvatar(true);

      if (!avatarUri) {
        const response = await profileService.deleteAvatar();
        if (response.success) {
          setProfile(prev => ({ ...prev, avatar: undefined, avatar_url: null }));
          Alert.alert('Berhasil', 'Foto profil berhasil dihapus');
        } else {
          Alert.alert('Gagal', response.error || 'Gagal menghapus foto profil');
        }
      } else {
        const response = await profileService.uploadAvatar(avatarUri);
        if (response.success && response.data) {
          setProfile(prev => ({
            ...prev,
            avatar: response.data!.avatar_url,
            avatar_url: response.data!.avatar_url,
          }));
          Alert.alert('Berhasil', 'Foto profil berhasil diperbarui');
        } else {
          Alert.alert('Gagal', response.error || 'Gagal mengupload foto profil');
        }
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan saat mengupdate foto profil');
    } finally {
      setUploadingAvatar(false);
    }
  }, []);

  // Ganti status 
  const handleStatusChange = (status: UserStatus) => {
    setProfile(prev => ({ ...prev, status }));
    setStatusModalVisible(false);
  };

  // Mount 
  useEffect(() => {
    loadProfile();
    loadNotificationSettings();
  }, [loadProfile, loadNotificationSettings]);

  return {
    // Data
    profile,
    loading,
    uploadingAvatar,
    messageCount,
    contactCount,

    // Modal
    editModalVisible,
    setEditModalVisible,
    statusModalVisible,
    setStatusModalVisible,
    editField,
    editValue,
    setEditValue,

    // Actions
    openEditModal,
    saveEdit,
    handleStatusChange,
    updateAvatar,
    reloadProfile: loadProfile,

    // Notification (gunakan update* untuk auto-save ke server)
    notifMessages,
    setNotifMessages,
    updateNotifMessages,
    notifCalls,
    setNotifCalls,
    updateNotifCalls,
    notifGroups,
    setNotifGroups,
    updateNotifGroups,

    // Privacy & security
    readReceipts,
    setReadReceipts,
    lastSeen,
    setLastSeen,
    twoFactor,
    setTwoFactor,
    biometric,
    setBiometric,
  };
};