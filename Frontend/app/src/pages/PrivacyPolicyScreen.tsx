import React from 'react';
import { View, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/app/src/context/ThemeContext';

// Import komponen
import { HeroSection } from '@/app/src/Components/privacy/HeroSection';
import { AccordionItem } from '@/app/src/Components/privacy/AccordionItem';
import { ContactCard } from '@/app/src/Components/privacy/ContactCard';
import { SECTIONS } from '@/app/src/utils/privacyData';
import { styles } from '@/app/src/utils/privacy';

const PrivacyPolicyScreen: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        <HeroSection />

        <View style={styles.sections}>
          {SECTIONS.map(section => (
            <AccordionItem key={section.id} section={section} />
          ))}
        </View>

        <ContactCard />
      </ScrollView>
    </View>
  );
};

export default PrivacyPolicyScreen;