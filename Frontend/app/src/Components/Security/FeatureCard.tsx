import React from 'react';
import { View, Text } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { SecurityFeature } from '@/app/src/hooks/Secuirty';
import { styles } from '@/app/src/utils/Security';

interface FeatureCardProps {
  feature: SecurityFeature;
}

export const FeatureCard: React.FC<FeatureCardProps> = ({ feature }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.featureRow, { backgroundColor: colors.card }]}>
      <View style={[styles.featureIcon, { backgroundColor: feature.color + '20' }]}>
        <MaterialCommunityIcons name={feature.icon as any} size={22} color={feature.color} />
      </View>
      <View style={styles.featureText}>
        <Text style={[styles.featureName, { color: colors.text }]}>{feature.label}</Text>
        <Text style={[styles.featureDesc, { color: colors.textSecondary }]}>{feature.desc}</Text>
      </View>
      <View style={[styles.activeBadge, { backgroundColor: feature.active ? '#4CAF5020' : '#66666620' }]}>
        <Text style={{ color: feature.active ? '#4CAF50' : '#888', fontSize: 10, fontWeight: '700' }}>
          {feature.active ? 'AKTIF' : 'OFF'}
        </Text>
      </View>
    </View>
  );
};