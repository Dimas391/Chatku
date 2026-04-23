import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useTheme } from '@/app/src/context/ThemeContext';

interface AppLogoProps {
  appName: string;
  version: string;
}

const AppLogo: React.FC<AppLogoProps> = ({ appName, version }) => {
  const { colors, isDarkMode } = useTheme();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.container,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Logo Mark */}
      <View style={[styles.logoMark, { backgroundColor: colors.primary }]}>
        <View style={styles.logoInner}>
          <View style={[styles.bubble, styles.bubbleLarge, { backgroundColor: 'rgba(255,255,255,0.35)' }]} />
          <View style={[styles.bubble, styles.bubbleSmall, { backgroundColor: 'rgba(255,255,255,0.55)' }]} />
        </View>
        <Text style={styles.logoLetter}>C</Text>
      </View>

      {/* App Name */}
      <Text style={[styles.appName, { color: colors.text }]}>{appName}</Text>

      {/* Version Badge */}
      <View style={[styles.versionBadge, { backgroundColor: isDarkMode ? 'rgba(255,107,53,0.15)' : 'rgba(255,107,53,0.1)', borderColor: colors.primary }]}>
        <View style={[styles.versionDot, { backgroundColor: colors.primary }]} />
        <Text style={[styles.versionText, { color: colors.primary }]}>{version}</Text>
      </View>

      {/* Tagline */}
      <Text style={[styles.tagline, { color: colors.textTertiary }]}>
        Smart Chat, Smarter You
      </Text>

      {/* Divider */}
      <View style={[styles.divider, { backgroundColor: colors.border }]} />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingTop: 48,
    paddingBottom: 32,
    paddingHorizontal: 24,
  },
  logoMark: {
    width: 88,
    height: 88,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    position: 'relative',
    shadowColor: '#FF6B35',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 10,
  },
  logoInner: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 26,
    overflow: 'hidden',
  },
  bubble: {
    position: 'absolute',
    borderRadius: 999,
  },
  bubbleLarge: {
    width: 60,
    height: 60,
    top: -20,
    right: -20,
  },
  bubbleSmall: {
    width: 30,
    height: 30,
    bottom: 4,
    left: 4,
  },
  logoLetter: {
    fontSize: 40,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: -1,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: 10,
  },
  versionBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 12,
  },
  versionDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  versionText: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  tagline: {
    fontSize: 14,
    letterSpacing: 0.2,
    marginBottom: 32,
  },
  divider: {
    width: 40,
    height: 1,
    borderRadius: 1,
    alignSelf: 'center',
  },
});

export default AppLogo;