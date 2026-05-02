import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useTranslation } from '@/app/src/hooks/useTranslation';

interface ProfileHeaderProps {
  isEditing: boolean;
  isSaving: boolean;
  onEdit: () => void;
  onSave: () => void;
  title?: string;
  onBackPress: () => void;
  onSkipPress?: () => void;
}

export const ProfileHeader: React.FC<ProfileHeaderProps> = ({
  isEditing,
  isSaving,
  onEdit,
  onSave,
  title,
  onBackPress,
  onSkipPress,
}) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();

  // Gunakan title dari props atau dari translation
  const headerTitle = title || t('complete_profile') || 'Lengkapi Profil';
  const skipText = t('skip') || 'Lewati';

  return (
    <View style={[
      styles.header, 
      { 
        paddingTop: insets.top + 8,
        backgroundColor: colors.header,
        borderBottomColor: colors.border,
      }
    ]}>
      <View style={styles.leftContainer}>
        <TouchableOpacity 
          style={[styles.backButton, { backgroundColor: isDarkMode ? '#2C2C2C' : colors.surface }]} 
          onPress={onBackPress}
        >
          <MaterialCommunityIcons name="arrow-left" size={24} color={colors.primary} />
        </TouchableOpacity>
      </View>
      
      <View style={styles.centerContainer}>
        <Text style={[styles.headerTitle, { color: colors.text }]} numberOfLines={1}>
          {headerTitle}
        </Text>
      </View>

      <View style={styles.rightContainer}>
        {onSkipPress && (
          <TouchableOpacity onPress={onSkipPress} style={{ marginRight: 12 }}>
            <Text style={[styles.skipText, { color: colors.primary }]}>{skipText}</Text>
          </TouchableOpacity>
        )}
        
        {!isEditing ? (
          <TouchableOpacity 
            onPress={onEdit}
            style={[styles.actionButton, { backgroundColor: isDarkMode ? '#2C2C2C' : colors.surface }]}
          >
            <MaterialCommunityIcons name="pencil" size={20} color={colors.primary} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            onPress={onSave} 
            disabled={isSaving}
            style={[styles.actionButton, { backgroundColor: isDarkMode ? '#2C2C2C' : colors.surface }]}
          >
            {isSaving ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialCommunityIcons name="check" size={22} color={colors.primary} />
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 16, 
    borderBottomWidth: 1,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
    zIndex: 10,
  },
  leftContainer: {
    flex: 1,
    alignItems: 'flex-start',
  },
  centerContainer: {
    flex: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rightContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  backButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButton: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
});