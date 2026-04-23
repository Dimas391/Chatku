import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';

interface PermissionInfoProps {
  show: boolean;
}

const PermissionInfo: React.FC<PermissionInfoProps> = ({ show }) => {
  if (!show || Platform.OS !== 'android') {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>
        Pastikan aplikasi memiliki izin kamera dan mikrofon
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 150,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(0,0,0,0.7)',
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    zIndex: 30,
  },
  text: {
    color: '#FF6B35',
    fontSize: 12,
  },
});

export default PermissionInfo;