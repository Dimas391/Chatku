import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';

interface ProfileFormProps {
  displayName: string;
  onDisplayNameChange: (text: string) => void;
  username: string;
  onUsernameChange: (text: string) => void;
  bio: string;
  onBioChange: (text: string) => void;
}

const ProfileForm = ({
  displayName,
  onDisplayNameChange,
  username,
  onUsernameChange,
  bio,
  onBioChange,
}: ProfileFormProps) => {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={styles.formContainer}>
      {/* Nama Lengkap */}
      <View style={styles.inputWrapper}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Nama Lengkap</Text>
        <View style={[
          styles.inputContainer, 
          isDarkMode ? styles.inputContainerDark : styles.inputContainerLight
        ]}>
          <MaterialCommunityIcons name="account" size={20} color="#FF6B35" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="Masukkan nama lengkap Anda"
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
            value={displayName}
            onChangeText={onDisplayNameChange}
          />
        </View>
      </View>

      {/* Username */}
      <View style={styles.inputWrapper}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Username</Text>
        <View style={[
          styles.inputContainer, 
          isDarkMode ? styles.inputContainerDark : styles.inputContainerLight
        ]}>
          <MaterialCommunityIcons name="at" size={20} color="#FF6B35" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { color: colors.text }]}
            placeholder="username"
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
            value={username}
            onChangeText={onUsernameChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
          Minimal 3 karakter, tanpa spasi
        </Text>
      </View>

      {/* Bio (opsional) */}
      <View style={styles.inputWrapper}>
        <Text style={[styles.inputLabel, { color: colors.text }]}>Bio (opsional)</Text>
        <View style={[
          styles.inputContainer, 
          styles.bioContainer, 
          isDarkMode ? styles.inputContainerDark : styles.inputContainerLight
        ]}>
          <MaterialCommunityIcons name="text" size={20} color="#FF6B35" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.bioInput, { color: colors.text }]}
            placeholder="Ceritakan tentang diri Anda"
            placeholderTextColor={isDarkMode ? '#666' : '#999'}
            value={bio}
            onChangeText={onBioChange}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
        <Text style={[styles.inputHint, { color: colors.textSecondary }]}>
          Maksimal 150 karakter
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  formContainer: {
    width: '100%',
  },
  inputWrapper: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  inputContainerDark: {
    backgroundColor: '#1E1E1E',
    borderColor: '#333333',
  },
  inputContainerLight: {
    backgroundColor: '#F8F9FA',
    borderColor: '#E9ECEF',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  bioContainer: {
    height: 'auto',
    minHeight: 100,
    paddingVertical: 14,
    alignItems: 'flex-start',
  },
  bioInput: {
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  inputHint: {
    fontSize: 12,
    marginTop: 6,
    marginLeft: 8,
    opacity: 0.8,
  },
});

export default ProfileForm;