import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useTranslation } from '@/app/src/hooks/useTranslation';

interface NewChatHeaderProps {
  title?: string;
  onBackPress: () => void;
}

const NewChatHeader = ({ title = 'Chat Baru', onBackPress }: NewChatHeaderProps) => {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
     <View style={styles.header}>
      <TouchableOpacity onPress={onBackPress}>
        <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
      </TouchableOpacity>
      <Text style={[styles.headerTitle, { color: colors.text }]}>{t('new_chat')}</Text>
      <View style={{ width: 40 }} />
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});

export default NewChatHeader;