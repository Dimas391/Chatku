// app/src/Components/About/DeveloperCard.tsx
import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';

interface DeveloperCardProps {
  name: string;
  role: string;
  github: string;
  avatar?: string;
  isLast?: boolean;
}

const DeveloperCard: React.FC<DeveloperCardProps> = ({
  name,
  role,
  github,
  avatar,
  isLast = false,
}) => {
  const { colors } = useTheme();
  const defaultAvatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=FF6B35&color=fff&size=100`;

  const openGithub = () => {
    Linking.openURL(`https://github.com/${github}`);
  };

  return (
    <View style={styles.container}>
      <Image source={{ uri: avatar || defaultAvatar }} style={styles.avatar} />

      <View style={styles.info}>
        <Text style={[styles.name, { color: colors.text }]}>{name}</Text>
        <Text style={[styles.role, { color: colors.textSecondary }]}>{role}</Text>
      </View>

      <TouchableOpacity
        onPress={openGithub}
        style={styles.githubBtn}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="github" size={16} color={colors.textSecondary} />
        <Text style={[styles.githubText, { color: colors.textSecondary }]}>{github}</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    backgroundColor: 'transparent',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  info: {
    flex: 1,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
  },
  role: {
    fontSize: 12,
    marginTop: 2,
  },
  githubBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  githubText: {
    fontSize: 12,
    fontWeight: '500',
  },
});

export default DeveloperCard;