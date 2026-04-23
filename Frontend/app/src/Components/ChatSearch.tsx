import React from 'react';
import {
  View,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useTranslation } from '@/app/src/hooks/useTranslation';

const { width } = Dimensions.get('window');

interface ChatSearchProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
}

const ChatSearch = ({ searchQuery, onSearchChange }: ChatSearchProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.searchContainer, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons 
          name="magnify" 
          size={width * 0.05} 
          color={colors.textTertiary} 
          style={styles.searchIcon} 
        />
        <TextInput
          style={[styles.searchInput, { color: colors.text }]}
          placeholder={t('search_chat')}
          placeholderTextColor={colors.textTertiary}
          value={searchQuery}
          onChangeText={onSearchChange}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity 
            onPress={() => onSearchChange('')}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons 
              name="close-circle" 
              size={width * 0.05} 
              color={colors.textTertiary} 
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: width * 0.06,
    paddingVertical: width * 0.02,
    width: '100%',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: width * 0.04,
    borderRadius: 25,
    height: Math.max(48, width * 0.12),
    width: '100%',
  },
  searchIcon: {
    marginRight: width * 0.02,
  },
  searchInput: {
    flex: 1,
    fontSize: width * 0.04,
    padding: 0,
    height: '100%',
  },
});

export default ChatSearch;