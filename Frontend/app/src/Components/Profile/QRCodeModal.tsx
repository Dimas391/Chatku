// app/src/Components/Profile/QRCodeModal.tsx
import React from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { UserProfile } from '@/app/src/hooks/Profile';

interface QRCodeModalProps {
  visible: boolean;
  profile: UserProfile;
  onClose: () => void;
}

export const QRCodeModal: React.FC<QRCodeModalProps> = ({
  visible,
  profile,
  onClose,
}) => {
  const { colors } = useTheme();

  // Data yang akan diencode ke QR Code
  const qrData = JSON.stringify({
    type: 'user_profile',
    user_id: profile.id,
    username: profile.username,
    display_name: profile.display_name || profile.name,
    avatar: profile.avatar_url,
    timestamp: Date.now(),
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContainer, { backgroundColor: colors.card }]}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
            <Text style={[styles.modalTitle, { color: colors.text }]}>QR Code Saya</Text>
            <View style={{ width: 40 }} />
          </View>

          {/* QR Code */}
          <View style={styles.qrContainer}>
            <View style={[styles.qrWrapper, { backgroundColor: '#fff', padding: 16, borderRadius: 20 }]}>
              <QRCode
                value={qrData}
                size={220}
                backgroundColor="white"
                color="#000"
              />
            </View>
          </View>

          {/* Info User */}
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: colors.text }]}>
              {profile.display_name || profile.name}
            </Text>
            <Text style={[styles.userUsername, { color: colors.textSecondary }]}>
              @{profile.username}
            </Text>
          </View>

          {/* Deskripsi */}
          <Text style={[styles.description, { color: colors.textSecondary }]}>
            Scan QR Code ini untuk menambahkan saya sebagai kontak
          </Text>

          {/* Tombol Tutup */}
          <TouchableOpacity
            style={[styles.closeModalButton, { backgroundColor: colors.border }]}
            onPress={onClose}
          >
            <Text style={[styles.closeModalText, { color: colors.text }]}>Tutup</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '85%',
    borderRadius: 24,
    padding: 20,
    alignItems: 'center',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 20,
  },
  closeButton: {
    padding: 8,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  qrContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  qrWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  userInfo: {
    alignItems: 'center',
    marginBottom: 12,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  userUsername: {
    fontSize: 13,
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    textAlign: 'center',
    marginBottom: 24,
  },
  closeModalButton: {
    width: '100%',
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeModalText: {
    fontSize: 14,
    fontWeight: '600',
  },
});