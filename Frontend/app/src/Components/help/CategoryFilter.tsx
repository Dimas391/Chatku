import React from 'react';
import { ScrollView, TouchableOpacity, Text } from 'react-native';
import { useTheme } from '@/app/src/context/ThemeContext';
import { styles } from '@/app/src/utils/StyleHelp';
import { CATEGORIES } from '@/app/src/utils/HelpSupport';

interface CategoryFilterProps {
  activeCategory: string;
  onSelect: (category: string) => void;
}

export const CategoryFilter: React.FC<CategoryFilterProps> = ({ activeCategory, onSelect }) => {
  const { colors } = useTheme();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.categoryRow}
    >
      {CATEGORIES.map(cat => (
        <TouchableOpacity
          key={cat}
          style={[
            styles.categoryChip,
            {
              backgroundColor: activeCategory === cat ? '#FF6B35' : colors.card,
              borderColor: activeCategory === cat ? '#FF6B35' : colors.border,
            },
          ]}
          onPress={() => onSelect(cat)}
          activeOpacity={0.75}
        >
          <Text
            style={[
              styles.categoryText,
              { color: activeCategory === cat ? '#fff' : colors.textSecondary },
            ]}
          >
            {cat}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
};