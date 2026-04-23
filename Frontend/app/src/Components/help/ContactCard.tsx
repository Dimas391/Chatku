import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { ContactOption } from '@/app/src/hooks/HelpSupport';
import { styles } from '@/app/src/utils/StyleHelp';

interface ContactCardProps {
  option: ContactOption;
}

export const ContactCard: React.FC<ContactCardProps> = ({ option }) => {
  const { colors } = useTheme();

  return (
    <TouchableOpacity
      style={[styles.contactCard, {  }]}
      onPress={option.onPress}
      activeOpacity={0.75}
    >
      <View style={[styles.contactIcon, { backgroundColor: option.color + '18' }]}>
        <MaterialCommunityIcons name={option.icon as any} size={22} color={option.color} />
      </View>
      <Text style={[styles.contactLabel, { color: colors.text }]}>{option.label}</Text>
      <Text style={[styles.contactSublabel, { color: colors.textSecondary }]} numberOfLines={1}>
        {option.sublabel}
      </Text>
    </TouchableOpacity>
  );
};