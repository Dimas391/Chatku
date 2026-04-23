import React, { useState } from 'react';
import {
  View,
  TouchableOpacity,
  Image,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import uploadService from '@/app/src/services/uploadService';

interface AvatarSectionProps {
  avatarUrl: string;
  displayName: string;
  onAvatarUpdate: (newAvatarUrl: string) => void;
}

const AvatarSection: React.FC<AvatarSectionProps> = ({
  avatarUrl,
  displayName,
  onAvatarUpdate,
}) => {
  const [uploading, setUploading] = useState(false);

  const handleChangeAvatar = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Izin diperlukan', 'Aplikasi memerlukan akses ke galeri');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setUploading(true);
      
      try {
        const uriParts = result.assets[0].uri.split('.');
        const fileType = uriParts[uriParts.length - 1];
        const fileName = `avatar_${Date.now()}.${fileType}`;
        
        const avatarUrl = await uploadService.uploadAvatar(result.assets[0].uri, fileName);
        if (avatarUrl) {
          onAvatarUpdate(avatarUrl);
          Alert.alert('Sukses', 'Foto profil berhasil diperbarui');
        } else {
          Alert.alert('Error', 'Gagal mengupload foto');
        }
      } catch (error: any) {
        Alert.alert('Error', error.message || 'Gagal mengupload foto');
      } finally {
        setUploading(false);
      }
    }
  };

  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(displayName)}&background=FF6B35&color=fff&size=200`;

  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleChangeAvatar} activeOpacity={0.8} disabled={uploading}>
        <Image
          source={{ uri: avatarUrl || defaultAvatar }}
          style={styles.avatar}
        />
        <View style={styles.editBadge}>
          {uploading ? (
            <ActivityIndicator size="small" color="#fff" />
          ) : (
            <MaterialCommunityIcons name="camera" size={16} color="#fff" />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    borderRadius: 20,
    padding: 6,
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default AvatarSection;