import React, { useCallback, useState } from 'react';
import {
  View,
  Text,
  SectionList,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/app/src/context/ThemeContext';
import { BaseScreen } from '@/app/src/Components/BaseScreen';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/src/Components/navigation/RootStackParamList';

// Import komponen
import { ContactItem } from '@/app/src/Components/Contact/ContactItem';
import { ContactHeader } from '@/app/src/Components/Contact/ContactHeader';
import { ContactSearch } from '@/app/src/Components/Contact/ContactSearch';
import { ContactStats } from '@/app/src/Components/Contact/ContactStats';
import { EmptyState } from '@/app/src/Components/Contact/EmptyState';
import { useContacts } from '@/app/src/hooks/useContacts';
import { InviteModal } from '@/app/src/Components/Contact/Invitemodal';
import { Contact, ContactSection } from '@/app/src/hooks/contact';
import { styles } from '@/app/src/utils/contact';
import chatService from '@/app/src/services/chatService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const groupContactsByAlphabet = (contacts: Contact[]): ContactSection[] => {
  const grouped: { [key: string]: Contact[] } = {};
  
  contacts.forEach(contact => {
    const firstLetter = contact.name.charAt(0).toUpperCase();
    if (!grouped[firstLetter]) {
      grouped[firstLetter] = [];
    }
    grouped[firstLetter].push(contact);
  });
  
  return Object.keys(grouped)
    .sort()
    .map(letter => ({
      title: letter,
      data: grouped[letter].sort((a, b) => a.name.localeCompare(b.name)),
    }));
};

const ContactsScreen = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors } = useTheme();
  
  const [inviteVisible, setInviteVisible] = useState(false);
  
  const {
    loading,
    refreshing,
    searchQuery,
    filteredContacts,
    setSearchQuery,
    loadContacts,
    onRefresh,
  } = useContacts();

  useFocusEffect(
    useCallback(() => {
      loadContacts();
    }, [loadContacts])
  );

  const handleStartChat = async (contact: Contact) => {
    try {
      
      const chatsResponse = await chatService.getChats();
      
      if (chatsResponse.success && chatsResponse.data) {
        const chats = chatsResponse.data.chats || [];
        
        const existingChat = chats.find((chat: any) => {
          const participants = chat.participants || [];
          return participants.includes(contact.id);
        });
        
        if (existingChat) {
          navigation.navigate('ChatDetailScreen' as any, {
            chatId: existingChat.id,
            chatName: contact.name,
            chatAvatar: contact.avatar || '',
            online: contact.status === 'online',
          });
        } else {
          const newChatResponse = await chatService.createPersonalChat(contact.id);
          
          if (newChatResponse.success && newChatResponse.data) {
            navigation.navigate('ChatDetailScreen' as any, {
              chatId: newChatResponse.data.id,
              chatName: contact.name,
              chatAvatar: contact.avatar || '',
              online: contact.status === 'online',
            });
          } else {
            Alert.alert('Error', 'Gagal membuat chat');
          }
        }
      } else {
        Alert.alert('Error', 'Gagal mendapatkan daftar chat');
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan');
    }
  };

  const handleAddContact = () => {
    Alert.alert(
      'Tambah Kontak Baru',
      'Masukkan nomor telepon atau email kontak',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tambah',
          onPress: () => {
            Alert.alert('Info', 'Fitur akan segera tersedia');
          },
        },
      ]
    );
  };

  // 🔴 Fungsi untuk membuka modal invite
  const handleInviteFriend = () => {
    setInviteVisible(true);
  };

  // 🔴 Fungsi untuk menutup modal invite
  const handleCloseInviteModal = () => {
    setInviteVisible(false);
  };

  const sections = groupContactsByAlphabet(filteredContacts);

  const renderSectionHeader = ({ section }: { section: ContactSection }) => (
    <View style={[styles.sectionHeader, { backgroundColor: colors.background }]}>
      <Text style={[styles.sectionHeaderText, { color: colors.textSecondary }]}>
        {section.title}
      </Text>
    </View>
  );

  if (loading) {
    return (
      <BaseScreen>
        <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            Memuat kontak...
          </Text>
        </View>
      </BaseScreen>
    );
  }

  return (
    <BaseScreen>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* 🔴 Modal Invite */}
        <InviteModal visible={inviteVisible} onClose={handleCloseInviteModal} />
        <ContactHeader onInvitePress={handleInviteFriend} />
        <ContactSearch searchQuery={searchQuery} onSearchChange={setSearchQuery} />
        <ContactStats count={filteredContacts.length} />
        {filteredContacts.length === 0 ? (
          <EmptyState searchQuery={searchQuery} onAddContact={handleAddContact} />
        ) : (
          <SectionList
            sections={sections}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ContactItem contact={item} onPress={handleStartChat} />
            )}
            renderSectionHeader={renderSectionHeader}
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
            stickySectionHeadersEnabled={false}
          />
        )}
      </View>
    </BaseScreen>
  );
};

export default ContactsScreen;