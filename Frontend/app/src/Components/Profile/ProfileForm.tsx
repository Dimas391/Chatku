import React from 'react';
import { View, Text, TextInput, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

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
  return (
    <View style={styles.formContainer}>
      {/* Nama Lengkap */}
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Nama Lengkap</Text>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="account" size={20} color="#FF6B35" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Masukkan nama lengkap Anda"
            placeholderTextColor="#999"
            value={displayName}
            onChangeText={onDisplayNameChange}
          />
        </View>
      </View>

      {/* Username */}
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Username</Text>
        <View style={styles.inputContainer}>
          <MaterialCommunityIcons name="at" size={20} color="#FF6B35" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="username"
            placeholderTextColor="#999"
            value={username}
            onChangeText={onUsernameChange}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>
        <Text style={styles.inputHint}>
          Minimal 3 karakter, tanpa spasi
        </Text>
      </View>

      {/* Bio (opsional) */}
      <View style={styles.inputWrapper}>
        <Text style={styles.inputLabel}>Bio (opsional)</Text>
        <View style={[styles.inputContainer, styles.bioContainer]}>
          <MaterialCommunityIcons name="text" size={20} color="#FF6B35" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, styles.bioInput]}
            placeholder="Ceritakan tentang diri Anda"
            placeholderTextColor="#999"
            value={bio}
            onChangeText={onBioChange}
            multiline
            numberOfLines={3}
            textAlignVertical="top"
          />
        </View>
        <Text style={styles.inputHint}>
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
    fontWeight: '500',
    color: '#333333',
    marginBottom: 6,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 50,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#333333',
    paddingVertical: 0,
  },
  bioContainer: {
    height: 'auto',
    minHeight: 80,
    paddingVertical: 12,
    alignItems: 'flex-start',
  },
  bioInput: {
    textAlignVertical: 'top',
    paddingVertical: 0,
  },
  inputHint: {
    fontSize: 11,
    color: '#999999',
    marginTop: 6,
    marginLeft: 4,
  },
});

export default ProfileForm;