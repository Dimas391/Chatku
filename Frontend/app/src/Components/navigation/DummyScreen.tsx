// app/src/Components/navigation/DummyScreen.tsx
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface DummyScreenProps {
  title: string;
  subtitle: string;
  iconName: string;
  accent?: string;
}

const DummyScreen: React.FC<DummyScreenProps> = ({
  title,
  subtitle,
  iconName,
  accent = '#FF6B35',
}) => {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.container, { paddingTop: insets.top + 24 }]}>
      <View style={[styles.iconCircle, { backgroundColor: `${accent}22` }]}>
        <MaterialCommunityIcons name={iconName as any} size={48} color={accent} />
      </View>
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
      <View style={[styles.badge, { borderColor: accent }]}>
        <Text style={[styles.badgeText, { color: accent }]}>Coming Soon</Text>
      </View>
    </View>
  );
};

export const CallsScreen = () => (
  <DummyScreen
    title="Panggilan"
    subtitle="Riwayat panggilan suara & video (WebRTC) akan tampil di sini."
    iconName="phone"
    accent="#34C759"
  />
);

export const SecurityScreen = () => (
  <DummyScreen
    title="Pusat Keamanan"
    subtitle="Security Dashboard, Key Verification, dan Digital Forensic Log."
    iconName="shield-lock"
    accent="#FF6B35"
  />
);

export const ContactsScreen = () => (
  <DummyScreen
    title="Kontak"
    subtitle="Daftar teman & mulai percakapan baru."
    iconName="account-plus"
    accent="#0A84FF"
  />
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0f0f0f',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#9a9a9a',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  badge: {
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default DummyScreen;
