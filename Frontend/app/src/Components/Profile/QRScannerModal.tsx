import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  StyleSheet,
  ActivityIndicator,
  Dimensions,
  StatusBar,
} from 'react-native';
import { Camera, CameraView } from 'expo-camera';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
 
const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const FRAME_SIZE = 240;
 
interface QRScannerModalProps {
  visible: boolean;
  onClose: () => void;
  onScan: (data: any) => void;
}
 
export const QRScannerModal: React.FC<QRScannerModalProps> = ({
  visible,
  onClose,
  onScan,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanning, setScanning] = useState(true);
 
  useEffect(() => {
    if (!visible) return;
    setScanning(true);
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, [visible]);
 
  // Tidak render apapun jika tidak visible
  if (!visible) return null;
 
  const handleBarCodeScanned = (data: any) => {
    if (!scanning) return;
    setScanning(false);
    try {
      const scannedData = JSON.parse(data.data);
      if (scannedData.type === 'user_profile') {
        onScan(scannedData);
        onClose();
      } else {
        Alert.alert('Error', 'QR Code tidak valid', [
          { text: 'Scan Ulang', onPress: () => setScanning(true) },
          { text: 'Batal', style: 'cancel', onPress: onClose },
        ]);
      }
    } catch {
      Alert.alert('Error', 'Gagal membaca QR Code', [
        { text: 'Scan Ulang', onPress: () => setScanning(true) },
        { text: 'Batal', style: 'cancel', onPress: onClose },
      ]);
    }
  };
 
  // ─── Permission loading ──────────────────────────────────────
  if (hasPermission === null) {
    return (
      <View style={styles.fullscreen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerBox}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.infoText}>Meminta izin kamera...</Text>
        </View>
      </View>
    );
  }
 
  // ─── Permission ditolak ──────────────────────────────────────
  if (hasPermission === false) {
    return (
      <View style={styles.fullscreen}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centerBox}>
          <MaterialCommunityIcons name="camera-off" size={56} color="#FF4444" />
          <Text style={styles.infoText}>Tidak ada akses ke kamera</Text>
          <TouchableOpacity
            style={styles.primaryBtn}
            onPress={async () => {
              const { status } = await Camera.requestCameraPermissionsAsync();
              setHasPermission(status === 'granted');
            }}
          >
            <Text style={styles.primaryBtnText}>Berikan Izin</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onClose} style={{ marginTop: 14 }}>
            <Text style={styles.linkText}>Tutup</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }
 
  // ─── Scanner aktif ───────────────────────────────────────────
  const frameTop = (SCREEN_H - FRAME_SIZE) / 2;
  const frameLeft = (SCREEN_W - FRAME_SIZE) / 2;
 
  return (
    <View style={styles.fullscreen}>
      <StatusBar barStyle="light-content" />
 
      {/* Kamera full screen — tidak ada clip, tidak ada Modal */}
      <CameraView
        style={StyleSheet.absoluteFill}
        onBarcodeScanned={scanning ? handleBarCodeScanned : undefined}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
 
      {/* Overlay gelap — 4 potongan di sekitar frame */}
      <View style={[styles.overlayTop, { height: frameTop }]} />
      <View style={[styles.overlayBottom, { height: frameTop }]} />
      <View style={[styles.overlaySide, { top: frameTop, left: 0, width: frameLeft, height: FRAME_SIZE }]} />
      <View style={[styles.overlaySide, { top: frameTop, right: 0, width: frameLeft, height: FRAME_SIZE }]} />
 
      {/* Frame sudut QR */}
      <View style={[styles.frame, { top: frameTop, left: frameLeft }]}>
        <View style={[styles.corner, styles.cTL]} />
        <View style={[styles.corner, styles.cTR]} />
        <View style={[styles.corner, styles.cBL]} />
        <View style={[styles.corner, styles.cBR]} />
      </View>
 
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="close" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Scan QR Code</Text>
        <View style={{ width: 38 }} />
      </View>
 
      {/* Hint + tombol batal di bawah frame */}
      <View style={[styles.footer, { bottom: insets.bottom + 32 }]}>
        <Text style={styles.hintText}>Arahkan kamera ke QR Code teman Anda</Text>
        <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
          <Text style={styles.cancelBtnText}>Batal</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};
 
const styles = StyleSheet.create({
  // Full screen absolute — menimpa seluruh layar tanpa Modal
  fullscreen: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: SCREEN_W,
    height: SCREEN_H,
    zIndex: 999,
    elevation: 999,
    backgroundColor: '#000',
  },
 
  // ── Overlay gelap 
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
  overlaySide: {
    position: 'absolute',
    backgroundColor: 'rgba(0,0,0,0.62)',
  },
 
  // ── Frame sudut
  frame: {
    position: 'absolute',
    width: FRAME_SIZE,
    height: FRAME_SIZE,
  },
  corner: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderColor: '#FF6B35',
  },
  cTL: { top: 0, left: 0, borderTopWidth: 3, borderLeftWidth: 3, borderTopLeftRadius: 5 },
  cTR: { top: 0, right: 0, borderTopWidth: 3, borderRightWidth: 3, borderTopRightRadius: 5 },
  cBL: { bottom: 0, left: 0, borderBottomWidth: 3, borderLeftWidth: 3, borderBottomLeftRadius: 5 },
  cBR: { bottom: 0, right: 0, borderBottomWidth: 3, borderRightWidth: 3, borderBottomRightRadius: 5 },
 
  // ── Header 
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  closeBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 17,
    fontWeight: '600',
  },
 
  // ── Footer 
  footer: {
    position: 'absolute',
    left: 24,
    right: 24,
    alignItems: 'center',
    gap: 14,
  },
  hintText: {
    color: 'rgba(255,255,255,0.75)',
    fontSize: 13,
    textAlign: 'center',
  },
  cancelBtn: {
    width: '100%',
    paddingVertical: 13,
    borderRadius: 14,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.35)',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  cancelBtnText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
 
  // ── Info states 
  centerBox: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  infoText: {
    color: '#fff',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 14,
    lineHeight: 20,
  },
  primaryBtn: {
    marginTop: 20,
    paddingHorizontal: 28,
    paddingVertical: 12,
    borderRadius: 25,
    backgroundColor: '#FF6B35',
  },
  primaryBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
  },
  linkText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 14,
  },
});
 