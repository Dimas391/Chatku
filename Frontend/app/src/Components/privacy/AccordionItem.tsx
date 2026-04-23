import React, { useState, useRef } from 'react';
import { View, Text, TouchableOpacity, Animated } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { Section } from '@/app/src/hooks/PrivacyPolicy';
import { styles } from '@/app/src/utils/privacy';

interface AccordionItemProps {
  section: Section;
}

export const AccordionItem: React.FC<AccordionItemProps> = ({ section }) => {
  const { colors } = useTheme();
  const [open, setOpen] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  const toggle = () => {
    const toValue = open ? 0 : 1;
    Animated.parallel([
      Animated.spring(anim, { toValue, useNativeDriver: false, tension: 60, friction: 10 }),
      Animated.timing(rotateAnim, { toValue, duration: 200, useNativeDriver: true }),
    ]).start();
    setOpen(!open);
  };

  const rotate = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '180deg'] });

  return (
    <View style={[styles.accordionItem, { borderColor: colors.border, backgroundColor: colors.card }]}>
      <TouchableOpacity style={styles.accordionHeader} onPress={toggle} activeOpacity={0.7}>
        <View style={[styles.sectionIcon, { backgroundColor: '#FF6B3515' }]}>
          <MaterialCommunityIcons name={section.icon as any} size={18} color="#FF6B35" />
        </View>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>{section.title}</Text>
        <Animated.View style={{ transform: [{ rotate }] }}>
          <MaterialCommunityIcons name="chevron-down" size={20} color={colors.textSecondary} />
        </Animated.View>
      </TouchableOpacity>

      {open && (
        <View style={[styles.accordionBody, { borderTopColor: colors.border }]}>
          <Text style={[styles.bodyText, { color: colors.textSecondary }]}>{section.content}</Text>
        </View>
      )}
    </View>
  );
};