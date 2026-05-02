import React, { useState } from 'react';
import {
  View,
  StyleSheet,
  StatusBar,
  KeyboardAvoidingView,
  ScrollView,
  Platform,
} from 'react-native';
import { useProfileSetup } from '@/app/src/hooks/UseProfile';
import { useTheme } from '@/app/src/context/ThemeContext';

// Import komponen
import BackgroundDecor from '@/app/src/Components/BackgroundDecor';
import { ProfileHeader } from '@/app/src/Components/Profile/ProfileHeader';
import AvatarPicker from '@/app/src/Components/Profile/AvatarPicker';
import ProfileForm from '@/app/src/Components/Profile/ProfileForm';
import TipsBox from '@/app/src/Components/Profile/TipsBox';
import SaveButton from '@/app/src/Components/Profile/SaveButton';

const ProfileSetupScreen = () => {
  const { colors, isDarkMode } = useTheme();
  // State untuk kontrol status edit dan save
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // State dan handler dari hook useProfileSetup
  const {
    displayName,
    setDisplayName,
    username,
    setUsername,
    bio,
    setBio,
    avatar,
    loading,
    handleAvatarChange,
    handleSaveProfile,
    handleSkip,
    handleBack,
  } = useProfileSetup();

  // Fungsi untuk mulai mode edit
  const handleEdit = () => {
    setIsEditing(true);
  };

  // Fungsi untuk menyimpan profil
  const handleSave = async () => {
    setIsSaving(true);
    await handleSaveProfile();
    setIsSaving(false);
    setIsEditing(false);
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar 
        barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
        backgroundColor={colors.background} 
      />
      <BackgroundDecor />
      
      {/* Header - Fixed at top, not scrolling */}
      <ProfileHeader
        title="Lengkapi Profil"
        isEditing={isEditing}
        isSaving={isSaving}
        onBackPress={handleBack}
        onSkipPress={handleSkip}
        onEdit={handleEdit}
        onSave={handleSave}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* AvatarPicker */}
          <AvatarPicker 
            avatar={avatar}
            onAvatarChange={handleAvatarChange} 
          />

          {/* Profile Form */}
          <ProfileForm 
            displayName={displayName}
            onDisplayNameChange={setDisplayName}
            username={username}
            onUsernameChange={setUsername}
            bio={bio}
            onBioChange={setBio}
          />

          {/* Tips Box */}
          <TipsBox />

          {/* Save Button */}
          <SaveButton 
            onPress={handleSaveProfile}
            loading={loading}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 120,
  },
});

export default ProfileSetupScreen;