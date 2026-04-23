// app/src/pages/HelpSupport/index.tsx
import React, { useState } from 'react';
import { View, ScrollView, Text } from 'react-native';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// Import komponen
import { HeroSection } from '@/app/src/Components/help/HeroSection';
import { ContactCard } from '@/app/src/Components/help/ContactCard';
import { SearchBar } from '@/app/src/Components/help/SearchBar';
import { CategoryFilter } from '@/app/src/Components/help/CategoryFilter';
import { FAQItem } from '@/app/src/Components/help/FAQItem';
import { EmptyState } from '@/app/src/Components/help/EmptyState';
import { FAQS, getContactOptions } from '@/app/src/utils/HelpSupport';
import { styles } from '@/app/src/utils/StyleHelp';

const HelpSupportScreen: React.FC = () => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [search, setSearch] = useState('');
  const [activeCategory, setActiveCategory] = useState('Semua');
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  // Filter FAQ
  const filteredFaqs = FAQS.filter(faq => {
    const matchCat = activeCategory === 'Semua' || faq.category === activeCategory;
    const matchSearch =
      search.trim() === '' ||
      faq.question.toLowerCase().includes(search.toLowerCase()) ||
      faq.answer.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const contactOptions = getContactOptions();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <HeroSection />

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>HUBUNGI KAMI</Text>
        <View style={styles.contactRow}>
          {contactOptions.map(opt => (
            <ContactCard key={opt.id} option={opt} />
          ))}
        </View>

        <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>PERTANYAAN UMUM</Text>
        <SearchBar value={search} onChangeText={setSearch} />
        <CategoryFilter activeCategory={activeCategory} onSelect={setActiveCategory} />

        <View style={styles.faqList}>
          {filteredFaqs.length === 0 ? (
            <EmptyState />
          ) : (
            filteredFaqs.map(faq => (
              <FAQItem
                key={faq.id}
                faq={faq}
                isOpen={openFaq === faq.id}
                onToggle={() => setOpenFaq(openFaq === faq.id ? null : faq.id)}
              />
            ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

export default HelpSupportScreen;