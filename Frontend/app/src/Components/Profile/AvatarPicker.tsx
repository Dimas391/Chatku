import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  Image, 
  StyleSheet, 
  Alert,
  ActivityIndicator 
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { useTheme } from '@/app/src/context/ThemeContext';

interface AvatarPickerProps {
  avatar: string | null;
  onAvatarChange: (uri: string | null) => void;
}

const AvatarPicker = ({ avatar, onAvatarChange }: AvatarPickerProps) => {
  const { colors, isDarkMode } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  // Fungsi untuk meminta izin kamera
  const requestCameraPermission = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Izin Diperlukan',
        'Aplikasi membutuhkan akses ke kamera untuk mengambil foto profil'
      );
      return false;
    }
    return true;
  };

  // Fungsi untuk meminta izin galeri
  const requestGalleryPermission = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Izin Diperlukan',
        'Aplikasi membutuhkan akses ke galeri untuk memilih foto profil'
      );
      return false;
    }
    return true;
  };

  // Fungsi untuk mengambil foto dari kamera
  const takePhoto = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) return;

    try {
      setIsLoading(true);
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        // Optimasi gambar
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 500, height: 500 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        onAvatarChange(manipulatedImage.uri);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Gagal mengambil foto. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk memilih gambar dari galeri
  const pickImage = async () => {
    const hasPermission = await requestGalleryPermission();
    if (!hasPermission) return;

    try {
      setIsLoading(true);

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
        base64: false,
      });

      if (!result.canceled && result.assets[0]) {
        // Optimasi gambar
        const manipulatedImage = await ImageManipulator.manipulateAsync(
          result.assets[0].uri,
          [{ resize: { width: 500, height: 500 } }],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG }
        );
        
        onAvatarChange(manipulatedImage.uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Gagal memilih gambar. Silakan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Fungsi untuk menghapus foto
  const removePhoto = () => {
    Alert.alert(
      'Hapus Foto',
      'Apakah Anda yakin ingin menghapus foto profil?',
      [
        { text: 'Batal', style: 'cancel' },
        { 
          text: 'Hapus', 
          onPress: () => onAvatarChange(null),
          style: 'destructive'
        },
      ]
    );
  };

  // Menu pilih sumber foto
  const showImageOptions = () => {
    if (avatar) {
      // Jika sudah ada foto, tampilkan opsi tambahan
      Alert.alert(
        'Foto Profil',
        'Pilih tindakan',
        [
          { text: 'Ambil Foto Baru', onPress: takePhoto },
          { text: 'Pilih dari Galeri', onPress: pickImage },
          { text: 'Hapus Foto', onPress: removePhoto, style: 'destructive' },
          { text: 'Batal', style: 'cancel' },
        ]
      );
    } else {
      // Jika belum ada foto
      Alert.alert(
        'Foto Profil',
        'Pilih sumber foto',
        [
          { text: 'Kamera', onPress: takePhoto },
          { text: 'Galeri', onPress: pickImage },
          { text: 'Batal', style: 'cancel' },
        ]
      );
    }
  };

  return (
    <View style={styles.avatarContainer}>
      <TouchableOpacity 
        onPress={showImageOptions} 
        style={styles.avatarWrapper}
        disabled={isLoading}
      >
        {isLoading ? (
          <LinearGradient
            colors={['#FF6B35', '#FF8C5A']}
            style={styles.avatarPlaceholder}
          >
            <ActivityIndicator size="large" color="#FFFFFF" />
          </LinearGradient>
        ) : avatar ? (
          <Image source={{ uri: avatar }} style={styles.avatar} />
        ) : (
          <LinearGradient
            colors={['#FF6B35', '#FF8C5A']}
            style={styles.avatarPlaceholder}
          >
            <MaterialCommunityIcons name="camera" size={30} color="#FFFFFF" />
          </LinearGradient>
        )}
        <View style={[styles.editBadge, { borderColor: isDarkMode ? colors.surface : '#FFFFFF' }]}>
          <MaterialCommunityIcons 
            name={avatar ? "pencil" : "plus"} 
            size={14} 
            color="#FFFFFF" 
          />
        </View>
      </TouchableOpacity>
      <Text style={[styles.avatarHint, { color: colors.textSecondary }]}>
        {isLoading ? 'Memproses...' : 'Tap untuk menambahkan foto'}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 8,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  avatarPlaceholder: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FF6B35',
  },
  editBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#FF6B35',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  avatarHint: {
    fontSize: 12,
    color: '#999999',
  },
});

export default AvatarPicker;