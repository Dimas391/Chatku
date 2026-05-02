import React from 'react';
import { View, Image, StyleSheet, Dimensions } from 'react-native';

const { height } = Dimensions.get('window');

const VerificationIllustration = () => {
  return (
    <View style={styles.illustrationContainer}>
      <Image
        source={require('@/assets/verifikasi_OTP.png')}
        style={styles.image}
        resizeMode="contain"
      />
    </View>
  );
};

const styles = StyleSheet.create({
  illustrationContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  image: {
    width: '100%',
    height: height * 0.30,
  },
});

export default VerificationIllustration;