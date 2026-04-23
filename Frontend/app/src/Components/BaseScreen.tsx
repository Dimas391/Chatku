import React from 'react';
import { View, ScrollView, StyleSheet, StatusBar, SafeAreaView } from 'react-native';
import { useTheme } from '@/app/src/context/ThemeContext';

interface BaseScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  safeArea?: boolean;
  statusBarColor?: string;
}

export const BaseScreen = ({ 
  children, 
  scroll = false, 
  safeArea = true,
  statusBarColor 
}: BaseScreenProps) => {
  const { colors, isDarkMode } = useTheme();
  
  const Container = scroll ? ScrollView : View;
  const Wrapper = safeArea ? SafeAreaView : View;
  
  return (
    <Wrapper style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={statusBarColor || colors.background} />
      <Container style={{ flex: 1, backgroundColor: colors.background }}>
        {children}
      </Container>
    </Wrapper>
  );
};