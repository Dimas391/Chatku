import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { FAQ } from '@/app/src/hooks/HelpSupport';
import { styles } from '@/app/src/utils/StyleHelp';

interface FAQItemProps {
  faq: FAQ;
  isOpen: boolean;
  onToggle: () => void;
}

export const FAQItem: React.FC<FAQItemProps> = ({ faq, isOpen, onToggle }) => {
  const { colors } = useTheme();

  return (
    <View style={[styles.faqItem, {  }]}>
      <TouchableOpacity style={styles.faqHeader} onPress={onToggle} activeOpacity={0.7}>
        <View style={[styles.faqCatBadge, { backgroundColor: '#2196F315' }]}>
          <Text style={[styles.faqCatText, { color: '#FF6B35' }]}>{faq.category}</Text>
        </View>
        <Text style={[styles.faqQuestion, { color: colors.text }]}>{faq.question}</Text>
        <MaterialCommunityIcons
          name={isOpen ? 'chevron-up' : 'chevron-down'}
          size={20}
          color={colors.textSecondary}
        />
      </TouchableOpacity>

      {isOpen && (
        <View style={[styles.faqBody, { borderTopColor: colors.border }]}>
          <Text style={[styles.faqAnswer, { color: colors.textSecondary }]}>{faq.answer}</Text>
        </View>
      )}
    </View>
  );
};