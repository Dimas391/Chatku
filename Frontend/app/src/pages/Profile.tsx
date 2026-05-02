// app/src/pages/Profile.tsx - Update bagian TENTANG

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  ScrollView,
  Switch,
  Alert,
  StatusBar,
  Animated,
  ActivityIndicator,
  TouchableOpacity,
  Platform,
  Linking,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { useTheme } from '@/app/src/context/ThemeContext';
import { BaseScreen } from '@/app/src/Components/BaseScreen';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '@/app/src/Components/navigation/RootStackParamList';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import * as ImagePicker from 'expo-image-picker';
import { useCallback } from 'react';

// Import komponen
import { ProfileHeader } from '@/app/src/Components/Profile/ProfileHeader1';
import { ProfileStats } from '@/app/src/Components/Profile/ProfileStats';
import { SectionHeader } from '@/app/src/Components/Profile/SectionHeader';
import { SettingRow } from '@/app/src/Components/Profile/SettingRow';
import { EditProfileModal } from '@/app/src/Components/Profile/EditProfileModal';
import { StatusModal } from '@/app/src/Components/Profile/StatusModal';
import { ActionButtons } from '@/app/src/Components/Profile/ActionButtons';
import { useProfile } from '@/app/src/hooks/useProfile1';
import { QRCodeModal } from '@/app/src/Components/Profile/QRCodeModal';
import { STATUS_OPTIONS } from '@/app/src/Components/Profile/constants';
import { QRScannerModal } from '@/app/src/Components/Profile/QRScannerModal';
import { PinSetupModal } from '@/app/src/Components/Profile/PinSetupModal';
import biometricService from '@/app/src/services/biometricService';
import { styles } from '@/app/src/utils/Profile';
import storageService from '../services/storageService';

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

const requestCameraPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Izin Diperlukan',
      'Aplikasi membutuhkan akses kamera. Buka Pengaturan untuk mengizinkan.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
};

const requestGalleryPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(
      'Izin Diperlukan',
      'Aplikasi membutuhkan akses galeri. Buka Pengaturan untuk mengizinkan.',
      [{ text: 'OK' }]
    );
    return false;
  }
  return true;
};

const openCamera = async (): Promise<string | null> => {
  const allowed = await requestCameraPermission();
  if (!allowed) return null;

  const result = await ImagePicker.launchCameraAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
};

const openGallery = async (): Promise<string | null> => {
  const allowed = await requestGalleryPermission();
  if (!allowed) return null;

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: true,
    aspect: [1, 1],
    quality: 0.8,
  });

  if (result.canceled) return null;
  return result.assets[0].uri;
};

const Profile1 = () => {
  const navigation = useNavigation<NavigationProp>();
  const { colors, isDarkMode, toggleTheme } = useTheme();
  const avatarScale = useRef(new Animated.Value(1)).current;

  const {
    profile,
    loading,
    messageCount,  
    contactCount,
    editModalVisible,
    setEditModalVisible,
    statusModalVisible,
    setStatusModalVisible,
    editField,
    editValue,
    setEditValue,
    openEditModal,
    saveEdit,
    handleStatusChange,
    updateAvatar,
    uploadingAvatar,
    reloadProfile, // Ambil fungsi reload
  } = useProfile();

  // Load security status & profile on focus
  useEffect(() => {
    loadSecurityStatus();
  }, []);

  useFocusEffect(
    useCallback(() => {
      reloadProfile();
    }, [reloadProfile])
  );

  const currentStatus = STATUS_OPTIONS.find(s => s.key === profile.status) || STATUS_OPTIONS[0];

  const animateAvatar = (callback: () => void) => {
    Animated.sequence([
      Animated.timing(avatarScale, { toValue: 0.92, duration: 100, useNativeDriver: true }),
      Animated.timing(avatarScale, { toValue: 1, duration: 100, useNativeDriver: true }),
    ]).start(callback);
  };

  // QR Code states
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [scannerModalVisible, setScannerModalVisible] = useState(false);

  // Biometric & PIN states
  const [biometricSupported, setBiometricSupported] = useState(false);
  const [biometricEnabled, setBiometricEnabled] = useState(false);
  const [biometricType, setBiometricType] = useState('');
  const [pinEnabled, setPinEnabled] = useState(false);
  const [loadingBiometric, setLoadingBiometric] = useState(false);
  const [pinSetupVisible, setPinSetupVisible] = useState(false);

  const loadSecurityStatus = async () => {
    const method = await biometricService.getActiveSecurityMethod();
    const bioAvailable = await biometricService.isBiometricAvailable();
    const bioType = await biometricService.getBiometricType();
    const hasPin = await biometricService.isPinSet();
    
    setBiometricSupported(bioAvailable);
    setBiometricType(bioType);
    setBiometricEnabled(method === 'biometric');
    setPinEnabled(hasPin);
  };

  const handleEnableBiometric = async () => {
    setLoadingBiometric(true);
    try {
      const success = await biometricService.enableBiometric();
      if (success) {
        await loadSecurityStatus();
        Alert.alert('Berhasil', `${biometricType} berhasil diaktifkan`);
      } else {
        Alert.alert('Gagal', 'Verifikasi biometrik tidak berhasil');
      }
    } catch (error) {
      Alert.alert('Error', 'Terjadi kesalahan');
    } finally {
      setLoadingBiometric(false);
    }
  };

  const handleDisableBiometric = async () => {
    await biometricService.disableBiometric();
    await loadSecurityStatus();
    Alert.alert('Berhasil', `${biometricType} dinonaktifkan`);
  };

  const handlePinSetupSuccess = async () => {
    await loadSecurityStatus();
    Alert.alert('Berhasil', 'PIN berhasil dibuat');
  };

  const handleDisablePin = async () => {
    Alert.alert(
      'Nonaktifkan PIN',
      'Apakah Anda yakin ingin menonaktifkan PIN keamanan?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Nonaktifkan',
          style: 'destructive',
          onPress: async () => {
            await biometricService.deletePin();
            await loadSecurityStatus();
            Alert.alert('Berhasil', 'PIN dinonaktifkan');
          },
        },
      ]
    );
  };

  const handleAvatarPress = () => {
    animateAvatar(() => {
      Alert.alert(
        'Foto Profil',
        'Pilih sumber foto',
        [
          {
            text: 'Kamera',
            onPress: async () => {
              const uri = await openCamera();
              if (uri) updateAvatar(uri);
            },
          },
          {
            text: 'Pilih dari Galeri',
            onPress: async () => {
              const uri = await openGallery();
              if (uri) updateAvatar(uri);
            },
          },
          {
            text: 'Hapus Foto',
            style: 'destructive',
            onPress: () => {
              Alert.alert(
                'Hapus Foto Profil',
                'Apakah Anda yakin ingin menghapus foto profil?',
                [
                  { text: 'Batal', style: 'cancel' },
                  { text: 'Hapus', style: 'destructive', onPress: () => updateAvatar(null) },
                ]
              );
            },
          },
          { text: 'Batal', style: 'cancel' },
        ]
      );
    });
  };

  const handleScanResult = (scannedData: any) => {
    Alert.alert(
      'Tambah Kontak',
      `Apakah Anda ingin menambahkan ${scannedData.display_name || scannedData.username} sebagai kontak?`,
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Tambah',
          onPress: async () => {
            try {
              const contactService = (await import('@/app/src/services/contactService')).default;
              const response = await contactService.addContact(scannedData.user_id);
              if (response.success) {
                Alert.alert('Berhasil', 'Kontak berhasil ditambahkan');
              } else {
                Alert.alert('Gagal', response.error || 'Gagal menambahkan kontak');
              }
            } catch (error) {
              Alert.alert('Error', 'Terjadi kesalahan');
            }
          },
        },
      ]
    );
  };
  
  const handleNavigateToPrivacyPolicy = () => {
    navigation.navigate('PrivacyPolicy' as never);
  };

  const handleNavigateToHelpSupport = () => {
    navigation.navigate('HelpSupport' as never);
  };

  const handleNavigateToAboutScreen = () => {
    navigation.navigate('About' as never);
  };

  const handleOpenQRCode = () => setQrModalVisible(true);
  const handleCloseQRCode = () => setQrModalVisible(false);
  const handleOpenScanner = () => setScannerModalVisible(true);
  const handleCloseScanner = () => setScannerModalVisible(false);

  const handleLogout = () => {
    Alert.alert(
      'Keluar',
      'Apakah Anda yakin ingin keluar dari akun ini?',
      [
        { text: 'Batal', style: 'cancel' },
        {
          text: 'Keluar',
          style: 'destructive',
          onPress: async () => {
            await storageService.clearTokens();
            navigation.reset({ index: 0, routes: [{ name: 'Login' as never }] });
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      'Hapus Akun',
      'Tindakan ini tidak dapat dibatalkan. Semua data Anda akan dihapus permanen.',
      [
        { text: 'Batal', style: 'cancel' },
        { text: 'Hapus Akun', style: 'destructive', onPress: () => {} },
      ]
    );
  };

  if (loading) {
    return (
      <BaseScreen>
        <View style={[styles.centerContainer, { backgroundColor: colors.background }]}>
          <ActivityIndicator size="large" color="#FF6B35" />
        </View>
      </BaseScreen>
    );
  }

  return (
    <BaseScreen>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} />
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView showsVerticalScrollIndicator={false}>
          <ProfileHeader
            profile={profile}
            currentStatus={currentStatus}
            avatarScale={avatarScale}
            onAvatarPress={handleAvatarPress}
            onStatusPress={() => setStatusModalVisible(true)}
            uploadingAvatar={uploadingAvatar}
          />

          <ProfileStats 
            profile={profile} 
            messageCount={messageCount}
            contactCount={contactCount}
          />

          <SectionHeader title="PROFIL" />
          <SettingRow icon="account-edit" label="Nama" sublabel={profile.name} onPress={() => openEditModal('name')} />
          <SettingRow icon="account" label="Username" sublabel={`@${profile.username}`} onPress={() => openEditModal('username')} />
          <SettingRow icon="text-box-edit" label="Bio" sublabel={profile.bio || 'Tidak ada bio'} onPress={() => openEditModal('bio')} />
          <SettingRow icon="phone" label="Nomor Telepon" sublabel={profile.phone || 'Belum diisi'} onPress={() => openEditModal('phone')} />
          <SettingRow icon="email-outline" label="Email" sublabel={profile.email || 'Belum diisi'} />
          <SettingRow icon="qrcode" label="QR Code Saya" sublabel="Bagikan profil via QR" onPress={handleOpenQRCode} />
          <SettingRow icon="qrcode-scan" label="Scan QR Code" sublabel="Tambah kontak via QR" onPress={handleOpenScanner} />

          <SectionHeader title="TAMPILAN" />
          <SettingRow
            icon={isDarkMode ? 'weather-night' : 'weather-sunny'}
            iconColor="#FF6B35"
            label="Mode Gelap"
            sublabel={isDarkMode ? 'Aktif' : 'Nonaktif'}
            rightElement={
              <Switch 
                value={isDarkMode} 
                onValueChange={toggleTheme}
                trackColor={{ false: '#ccc', true: '#FF6B3560' }}
                thumbColor={isDarkMode ? '#FF6B35' : '#f4f3f4'} 
              />
            }
          />

          <SectionHeader title="KEAMANAN APLIKASI" />
          
          {biometricSupported && (
            <SettingRow
              icon="fingerprint"
              label={`Kunci ${biometricType}`}
              sublabel={biometricEnabled 
                ? `${biometricType} aktif (prioritas utama)` 
                : `Aktifkan ${biometricType} untuk keamanan`}
              iconColor="#9C27B0"
              rightElement={
                biometricEnabled ? (
                  <TouchableOpacity onPress={handleDisableBiometric}>
                    <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                  </TouchableOpacity>
                ) : (
                  <Switch
                    value={false}
                    onValueChange={handleEnableBiometric}
                    disabled={loadingBiometric}
                    trackColor={{ false: '#ccc', true: '#9C27B060' }}
                    thumbColor="#f4f3f4"
                  />
                )
              }
            />
          )}

          <SettingRow
            icon="lock"
            label="Kunci PIN"
            sublabel={
              biometricSupported
                ? (pinEnabled ? 'PIN aktif (cadangan jika biometrik gagal)' : 'Aktifkan PIN sebagai cadangan')
                : (pinEnabled ? 'PIN 6 digit aktif' : 'Aktifkan PIN 6 digit untuk keamanan')
            }
            rightElement={
              pinEnabled ? (
                <TouchableOpacity onPress={handleDisablePin}>
                  <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                </TouchableOpacity>
              ) : (
                <Switch
                  value={false}
                  onValueChange={() => setPinSetupVisible(true)}
                  trackColor={{ false: '#ccc', true: '#FF980060' }}
                  thumbColor="#f4f3f4"
                />
              )
            }
          />

          <SettingRow 
            icon="shield-lock" 
            label="Pusat Keamanan" 
            sublabel="Lihat status keamanan akun" 
            iconColor="#FF6B35"
            onPress={() => navigation.navigate('SecurityScreen' as never)} 
          />

          {/*  BAGIAN TENTANG */}
          <SectionHeader title="TENTANG" />

          <SettingRow 
            icon="information-outline"
            label="Tentang ChatKu" 
            sublabel="Informasi enkripsi dan privasi data"
            onPress={handleNavigateToAboutScreen}
          />
          
          <SettingRow 
            icon="cellphone-arrow-down" 
            label="Versi Aplikasi" 
            sublabel="1.0.0 (build 42)" 
            onPress={() => {
              Alert.alert(
                'Versi Aplikasi', 
                'ChatKu\nVersi 1.0.0 (Build 42)\n\n© 2025 ChatKu Team\nAll rights reserved.'
              );
            }}
          />
          
          <SettingRow 
            icon="file-document-outline" 
            label="Kebijakan Privasi" 
            sublabel="Pelajari bagaimana kami melindungi data Anda"
            onPress={handleNavigateToPrivacyPolicy}
          />
          
          <SettingRow 
            icon="help-circle-outline" 
            label="Bantuan & Dukungan" 
            sublabel="Pusat bantuan dan FAQ"
            onPress={handleNavigateToHelpSupport}
          />

          <SectionHeader title="AKUN" />
          <ActionButtons onLogout={handleLogout} onDeleteAccount={handleDeleteAccount} />

          <View style={{ height: 40 }} />
        </ScrollView>

        <EditProfileModal
          visible={editModalVisible}
          field={editField}
          value={editValue}
          onChangeText={setEditValue}
          onSave={saveEdit}
          onClose={() => setEditModalVisible(false)}
        />

        <StatusModal
          visible={statusModalVisible}
          currentStatus={profile.status}
          statusOptions={STATUS_OPTIONS}
          onSelect={handleStatusChange}
          onClose={() => setStatusModalVisible(false)}
        />

        <PinSetupModal
          visible={pinSetupVisible}
          onClose={() => setPinSetupVisible(false)}
          onSuccess={handlePinSetupSuccess}
        />
      </View>
      
      <QRScannerModal
        visible={scannerModalVisible}
        onClose={handleCloseScanner}
        onScan={handleScanResult}
      />

      <QRCodeModal
        visible={qrModalVisible}
        profile={profile}
        onClose={handleCloseQRCode}
      />
    </BaseScreen>
  );
};

export default Profile1;