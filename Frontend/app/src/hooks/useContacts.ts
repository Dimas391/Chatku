import { useState, useCallback, useEffect } from 'react';
import { Contact } from '@/app/src/hooks/contact';
import contactService from '@/app/src/services/contactService';

const DUMMY_CONTACTS: Contact[] = [
  {
    id: '1',
    name: 'Ahmad Rizal',
    status: 'online',
    isVerified: true,
    mutualFriends: 5,
  },
  {
    id: '2',
    name: 'Siti Nurhaliza',
    status: 'online',
    isVerified: true,
    mutualFriends: 3,
  },
  {
    id: '3',
    name: 'Budi Santoso',
    status: 'offline',
    lastSeen: '2 jam lalu',
    isVerified: false,
    mutualFriends: 2,
  },
];

export const useContacts = () => {
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const loadContacts = useCallback(async () => {
    try {
      setLoading(true);
      
      // Coba ambil dari API
      const response = await contactService.getContactsFromChats();
      
      if (response.success && response.data && response.data.length > 0) {
        const formattedContacts: Contact[] = response.data.map((contact: any) => ({
          id: contact.user_id || contact.id,
          name: contact.name || contact.display_name,
          avatar: contact.avatar_url,
          status: contact.is_online ? 'online' : 'offline',
          lastSeen: contact.last_seen,
          phoneNumber: contact.phone,
          email: contact.email,
          isVerified: contact.is_verified,
          mutualFriends: contact.mutual_friends || 0,
        }));
        setContacts(formattedContacts);
      } else {
        setContacts(DUMMY_CONTACTS);
      }
    } catch (error) {
      setContacts(DUMMY_CONTACTS);
    } finally {
      setLoading(false);
    }
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadContacts();
    setRefreshing(false);
  }, [loadContacts]);

  // Auto load saat pertama kali
  useEffect(() => {
    loadContacts();
  }, []);

  const filteredContacts = contacts.filter(contact => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return contact.name.toLowerCase().includes(query);
  });

  return {
    loading,
    refreshing,
    contacts,
    searchQuery,
    filteredContacts,
    setSearchQuery,
    loadContacts,
    onRefresh,
  };
};