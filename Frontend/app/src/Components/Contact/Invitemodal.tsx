import React, { useRef, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  Share,
  Clipboard,
  StyleSheet,
  ToastAndroid,
  Platform,
  Linking,
  Animated,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';

const INVITE_LINK = 'https://myapp.page.link/invite/abc123';
const INVITE_MESSAGE = `Hei! Yuk bergabung dan chat bareng di aplikasi ini 🎉\n${INVITE_LINK}`;

interface InviteModalProps {
  visible: boolean;
  onClose: () => void;
}

interface ShareOption {
  label: string;
  icon: any; 
  bg: string;
  iconColor: string;
  onPress: () => void;
}

export const InviteModal = ({ visible, onClose }: InviteModalProps) => {
  const { colors } = useTheme();
  const slideAnim = useRef(new Animated.Value(80)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 65,
          friction: 11,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      slideAnim.setValue(80);
      opacityAnim.setValue(0);
    }
  }, [visible]);

  const showToast = (msg: string) => {
    if (Platform.OS === 'android') {
      ToastAndroid.show(msg, ToastAndroid.SHORT);
    }
  };

  const handleCopyLink = () => {
    Clipboard.setString(INVITE_LINK);
    showToast('Link berhasil disalin!');
  };

  const handleShareNative = async () => {
    try {
      await Share.share({ message: INVITE_MESSAGE, url: INVITE_LINK });
      onClose();
    } catch (e) {
      console.error('Share error:', e);
    }
  };

  const handleWhatsApp = async () => {
    const url = `whatsapp://send?text=${encodeURIComponent(INVITE_MESSAGE)}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      onClose();
    } else {
      showToast('WhatsApp tidak terinstall');
    }
  };

  const handleTelegram = async () => {
    const url = `tg://msg?text=${encodeURIComponent(INVITE_MESSAGE)}`;
    const supported = await Linking.canOpenURL(url);
    if (supported) {
      await Linking.openURL(url);
      onClose();
    } else {
      showToast('Telegram tidak terinstall');
    }
  };

  const handleSMS = async () => {
    const url = Platform.OS === 'ios'
      ? `sms:&body=${encodeURIComponent(INVITE_MESSAGE)}`
      : `sms:?body=${encodeURIComponent(INVITE_MESSAGE)}`;
    await Linking.openURL(url);
    onClose();
  };

  const shareOptions: ShareOption[] = [
    { label: 'WhatsApp', icon: 'whatsapp', bg: '#E8F5E9', iconColor: '#25D366', onPress: handleWhatsApp },
    { label: 'Telegram', icon: 'send', bg: '#E3F2FD', iconColor: '#0088cc', onPress: handleTelegram },
    { label: 'SMS', icon: 'message-text', bg: '#FFF3E0', iconColor: '#FF9800', onPress: handleSMS },
    { label: 'Lainnya', icon: 'share-variant', bg: '#F3F0FF', iconColor: '#FF6B35', onPress: handleShareNative },
  ];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.card,
                { backgroundColor: colors.background, transform: [{ translateY: slideAnim }] },
              ]}
            >
              {/* Drag handle */}
              <View style={styles.dragHandle} />

              {/* Icon */}
              <View style={[styles.iconWrap, { backgroundColor: '#FF6B3520' }]}>
                <MaterialCommunityIcons name="share-variant" size={32} color="#FF6B35" />
              </View>

              {/* Title + subtitle */}
              <Text style={[styles.title, { color: colors.text }]}>Undang Teman</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                Bagikan link dan ajak teman bergabung ke aplikasi ini
              </Text>

              {/* Link box */}
              <View style={[styles.linkBox, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                <Text style={[styles.linkText, { color: colors.textSecondary }]} numberOfLines={1}>
                  {INVITE_LINK}
                </Text>
                <TouchableOpacity onPress={handleCopyLink} style={styles.copyBtn} activeOpacity={0.7}>
                  <Text style={styles.copyBtnText}>Salin</Text>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.dividerRow}>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
                <Text style={[styles.dividerLabel, { color: colors.textTertiary }]}>atau bagikan lewat</Text>
                <View style={[styles.dividerLine, { backgroundColor: colors.border }]} />
              </View>

              {/* Share options */}
              <View style={styles.shareRow}>
                {shareOptions.map((opt) => (
                  <TouchableOpacity
                    key={opt.label}
                    style={styles.shareOption}
                    onPress={opt.onPress}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.shareIcon, { backgroundColor: opt.bg }]}>
                      <MaterialCommunityIcons name={opt.icon as any} size={28} color={opt.iconColor} />
                    </View>
                    <Text style={[styles.shareLabel, { color: colors.textSecondary }]}>{opt.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Buttons */}
              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.btnCancel, { borderColor: colors.border }]}
                  onPress={onClose}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.btnCancelText, { color: colors.textSecondary }]}>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnShare}
                  onPress={handleShareNative}
                  activeOpacity={0.85}
                >
                  <Text style={styles.btnShareText}>Bagikan</Text>
                </TouchableOpacity>
              </View>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  card: {
    width: '100%',
    borderRadius: 20,
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#DDDDDD',
    alignSelf: 'center',
    marginBottom: 20,
  },
  iconWrap: {
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 19,
    marginBottom: 20,
  },
  linkBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 0.5,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 18,
    gap: 8,
  },
  linkText: { flex: 1, fontSize: 12 },
  copyBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#FFF0EA',
  },
  copyBtnText: {
    fontSize: 12,
    color: '#FF6B35',
    fontWeight: '600',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 18,
  },
  dividerLine: { flex: 1, height: 0.5 },
  dividerLabel: { fontSize: 11 },
  shareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  shareOption: { alignItems: 'center', gap: 6, flex: 1 },
  shareIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareLabel: { fontSize: 11 },
  btnRow: { flexDirection: 'row', gap: 10 },
  btnCancel: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 0.5,
    alignItems: 'center',
  },
  btnCancelText: { fontSize: 14 },
  btnShare: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: '#FF6B35',
    alignItems: 'center',
  },
  btnShareText: { fontSize: 14, color: '#FFFFFF', fontWeight: '600' },
});