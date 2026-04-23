import React from 'react';
import { View, Text, TouchableOpacity, Alert, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { styles } from '@/app/src/utils/StyleHelp';

export const TicketCard: React.FC = () => {
  const { colors } = useTheme();

  const handleSubmitTicket = () => {
    Alert.alert(
      'Kirim Tiket',
      'Fitur pengiriman tiket akan segera tersedia. Sementara hubungi kami melalui email.',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Kirim Email', onPress: () => Linking.openURL('mailto:support@myapp.id') },
      ]
    );
  };

  return (
    <View style={[styles.ticketCard, { backgroundColor: '#FF6B350D', borderColor: '#FF6B3530' }]}>
      <MaterialCommunityIcons name="ticket-outline" size={28} color="#FF6B35" />
      <Text style={[styles.ticketTitle, { color: colors.text }]}>Tidak menemukan jawaban?</Text>
      <Text style={[styles.ticketSub, { color: colors.textSecondary }]}>
        Kirim tiket dukungan dan tim kami akan merespons dalam 24 jam.
      </Text>
      <TouchableOpacity style={styles.ticketBtn} onPress={handleSubmitTicket} activeOpacity={0.8}>
        <Text style={styles.ticketBtnText}>Kirim Tiket</Text>
      </TouchableOpacity>
    </View>
  );
};