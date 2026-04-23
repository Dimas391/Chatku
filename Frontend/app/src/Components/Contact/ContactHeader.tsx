import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { styles } from '@/app/src/utils/contact';

interface ContactHeaderProps {
  onInvitePress: () => void;
}

export const ContactHeader: React.FC<ContactHeaderProps> = ({ onInvitePress }) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets(); 
  return (
    <View style={[
      styles.header, 
      { 
        paddingTop: insets.top > 0 ? insets.top : 20, 
        backgroundColor: colors.background 
      }
    ]}>
      <View style={styles.headerTop}>
        <Text style={[styles.headerTitle, { color: colors.text }]}>Kontak</Text>
        <TouchableOpacity 
          onPress={onInvitePress}
          style={{ padding: 4 }} 
        >
          <MaterialCommunityIcons name="account-plus" size={26} color="#FF6B35" />
        </TouchableOpacity>
      </View>
    </View>
  );
};