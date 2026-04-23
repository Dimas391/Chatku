import React from 'react';
import { View, Text, TouchableOpacity, Linking } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { styles } from '@/app/src/utils/privacy';

export const ContactCard: React.FC = () => {
  const { colors } = useTheme();

  const handleEmailPress = () => {
    Linking.openURL('mailto:privacy@myapp.id');
  };

  return (
    <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
      <Text style={[styles.contactTitle, { color: colors.text }]}>Ada Pertanyaan?</Text>
      <Text style={[styles.contactSub, { color: colors.textSecondary }]}>
        Hubungi tim privasi kami jika Anda memiliki pertanyaan tentang kebijakan ini.
      </Text>
      <TouchableOpacity style={styles.contactBtn} onPress={handleEmailPress} activeOpacity={0.8}>
        <MaterialCommunityIcons name="email-outline" size={16} color="#fff" />
        <Text style={styles.contactBtnText}>privacy@myapp.id</Text>
      </TouchableOpacity>
    </View>
  );
};