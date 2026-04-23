import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface TextContentProps {
  appName?: string;
  tagline?: string;
  taglineSub?: string;
}

const TextContent = ({ 
  appName = 'SafeChat',
  tagline = 'Chat cepat, aman, dan simpel',
  taglineSub = 'hanya dengan teks.'
}: TextContentProps) => {
  return (
    <View style={styles.textContainer}>
      <Text style={styles.appName}>{appName}</Text>
      <Text style={styles.tagline}>
        {tagline}{'\n'}
        <Text style={styles.taglineSub}>{taglineSub}</Text>
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  textContainer: {
    alignItems: 'center',
    marginBottom: 30,
  },
  appName: {
    fontSize: 42,
    fontWeight: '800',
    color: '#333333',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: 18,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 28,
  },
  taglineSub: {
    color: '#FF6B35',
    fontWeight: '600',
  },
});

export default TextContent;