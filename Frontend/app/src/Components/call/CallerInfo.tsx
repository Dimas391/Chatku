import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface CallerInfoProps {
  name: string;
}

const CallerInfo: React.FC<CallerInfoProps> = ({ name }) => {
  return (
    <View style={styles.container}>
      <Text style={styles.name}>{name}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 12,
  },
  name: {
    fontSize: 28,
    fontWeight: '600',
    color: '#fff',
    textAlign: 'center',
  },
});

export default CallerInfo;