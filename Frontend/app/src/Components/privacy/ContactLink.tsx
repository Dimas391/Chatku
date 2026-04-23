import React from 'react';
import {
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';

interface ContactLinkProps {
  email: string;
}

const ContactLink: React.FC<ContactLinkProps> = ({ email }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => Linking.openURL(`mailto:${email}`)}
    >
      <MaterialCommunityIcons name="email" size={20} color={colors.primary} />
      <Text style={[styles.text, { color: colors.primary }]}>{email}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  text: {
    fontSize: 14,
  },
});

export default ContactLink;