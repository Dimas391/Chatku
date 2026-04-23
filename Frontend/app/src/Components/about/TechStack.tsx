import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';

interface TechItem {
  name: string;
  icon: string;
  color: string;
  bgLight: string;
  bgDark: string;
}

const techItems: TechItem[] = [
  { name: 'React Native', icon: 'react', color: '#61DAFB', bgLight: '#565151', bgDark: '#121212'},
  { name: 'FastAPI', icon: 'language-python', color: '#3776AB', bgLight: '#565151', bgDark: '#121212' },
  { name: 'MongoDB', icon: 'database', color: '#47A248', bgLight: '#565151', bgDark: '#121212' },        // Database relasional Laravel
  { name: 'Web Socket', icon: 'web', color: '#FF6B35', bgLight: '#565151', bgDark: '#121212' }, // Untuk real-time chat
  { name: 'AES-RSA', icon: 'shield-lock', color: '#3e56ce', bgLight: '#565151', bgDark: '#121212' },   // Fokus utama skripsi kamu
];

const TechStack: React.FC = () => {
  const { colors, isDarkMode } = useTheme();

  return (
    <View style={styles.grid}>
      {techItems.map((item, index) => (
        <View
          key={index}
          style={[
            styles.techItem,
            { backgroundColor: isDarkMode ? item.bgDark : item.bgLight },
          ]}
        >
          <View style={[styles.iconWrap, { backgroundColor: isDarkMode ? 'rgba(255,255,255,0.06)' : 'rgba(255,255,255,0.8)' }]}>
            <MaterialCommunityIcons name={item.icon as any} size={22} color={item.color} />
          </View>
          <Text style={[styles.techName, { color: colors.text }]}>{item.name}</Text>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingVertical: 8,
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  techItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: '45%',
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  techName: {
    fontSize: 13,
    fontWeight: '500',
  },
});

export default TechStack;