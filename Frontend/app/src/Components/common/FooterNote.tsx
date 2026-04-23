import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface FooterNoteProps {
  text: string;
}

const FooterNote: React.FC<FooterNoteProps> = ({ text }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingVertical: 24,
    alignItems: 'center',
    marginBottom: 20,
  },
  text: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default FooterNote;