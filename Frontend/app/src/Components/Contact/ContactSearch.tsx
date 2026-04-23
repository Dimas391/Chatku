import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { styles as contactStyles } from '@/app/src/utils/contact';

interface ContactSearchProps {
  searchQuery: string;
  onSearchChange: (text: string) => void;
}

export const ContactSearch: React.FC<ContactSearchProps> = ({ searchQuery, onSearchChange }) => {
  const { colors } = useTheme();

  return (
    // View pembungkus luar untuk memberi jarak dari pinggir layar
    <View style={localStyles.wrapper}>
      <View style={[
        contactStyles.searchContainer, 
        { 
          backgroundColor: colors.card,
          borderRadius: 12, 
          paddingHorizontal: 12,
          elevation: 2, 
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 1 },
          shadowOpacity: 0.1,
          shadowRadius: 2,
        }
      ]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textSecondary} />
        
        <TextInput
          style={[
            contactStyles.searchInput, 
            { color: colors.text, flex: 1, height: 45 } 
          ]}
          placeholder="Cari kontak..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={onSearchChange}
          autoCorrect={false} 
        />

        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => onSearchChange('')} 
            style={{ padding: 4 }}
          >
            <MaterialCommunityIcons name="close-circle" size={18} color={colors.textSecondary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

// Style tambahan untuk mengatur layout agar tidak memenuhi layar
const localStyles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 8, 
    paddingVertical: 10,  
    width: '100%',
    maxWidth: 500,         
    alignSelf: 'center',   
  }
});