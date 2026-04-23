import React from 'react';
import { View, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useTranslation } from '@/app/src/hooks/useTranslation';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  onClear: () => void;
  placeholder?: string;
}

const SearchBar = ({ 
  value, 
  onChangeText, 
  onClear, 
  placeholder 
}: SearchBarProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  // Gunakan placeholder dari props atau dari translation
  const inputPlaceholder = placeholder || t('search_placeholder') || 'Cari nama atau username...';

  return (
    <View style={[styles.searchContainer, { backgroundColor: colors.background }]}>
      <View style={[styles.searchBox, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={colors.textTertiary} />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={inputPlaceholder}
          value={value}
          onChangeText={onChangeText}
          placeholderTextColor={colors.textTertiary}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {value.length > 0 && (
          <TouchableOpacity onPress={onClear}>
            <MaterialCommunityIcons name="close-circle" size={20} color={colors.textTertiary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  searchContainer: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    borderRadius: 25,
    height: 48,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingHorizontal: 8,
    paddingVertical: 0,
  },
});

export default SearchBar;