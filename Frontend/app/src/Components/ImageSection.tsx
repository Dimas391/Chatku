import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

interface ImageSectionProps {
  imageSource?: any;
  showLockOverlay?: boolean;
}

const ImageSection = ({ 
  imageSource = require('@/assets/logo/logo.png'),
  showLockOverlay = true 
}: ImageSectionProps) => {
  return (
    <View style={styles.imageContainer}>
      <Image 
        source={imageSource} 
        style={styles.image}
        resizeMode="contain"
      />
      {showLockOverlay && (
        <View style={styles.lockOverlay}>
          <MaterialCommunityIcons name="lock-outline" size={50} color="#FFE4D6" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  imageContainer: {
    height: height * 0.35,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 30,
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  lockOverlay: {
    position: 'absolute',
    bottom: 10,
    right: 10,
    opacity: 0.3,
  },
});

export default ImageSection;