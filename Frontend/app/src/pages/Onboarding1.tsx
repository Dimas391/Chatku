import React from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';
import { MaterialCommunityIcons } from '@expo/vector-icons';

import BackgroundDecor from '@/app/src/Components/BackgroundDecor';
import Header from '@/app/src/Components/Header';
import NextButton from '@/app/src/Components/NextButton';

const { height } = Dimensions.get('window');

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding1'>;

const Onboarding1Screen = () => {
  const navigation = useNavigation<NavigationProp>();

  const navigateNext = () => {
    navigation.navigate('Onboarding2');
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <BackgroundDecor />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Header currentStep={1} totalSteps={3} />

          {/* Illustration Section */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require('@/assets/onboarding_security.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </View>

          {/* Text Section */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Pesan Aman{'\n'}& Terenkripsi</Text>
            <Text style={styles.subtitle}>
              Setiap pesan dilindungi dengan enkripsi{'\n'}
              <Text style={styles.subtitleHighlight}>end-to-end</Text> sehingga hanya kamu{'\n'}
              dan penerima yang bisa membacanya.
            </Text>
          </View>

          {/* Feature chips */}
          <View style={styles.chipContainer}>
            <View style={styles.chip}>
              <MaterialCommunityIcons name="lock-outline" size={16} color="#FF6B35" />
              <Text style={styles.chipText}>Enkripsi E2E</Text>
            </View>
            <View style={styles.chip}>
              <MaterialCommunityIcons name="key-outline" size={16} color="#FF6B35" />
              <Text style={styles.chipText}>RSA + AES</Text>
            </View>
          </View>

          <View style={styles.bottomSection}>
            <NextButton onPress={navigateNext} title="Selanjutnya" />
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  safeArea: {
    flex: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  illustrationContainer: {
    height: height * 0.38,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  image: {
    width: '116%',
    height: '120%',
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: '800',
    color: '#222222',
    textAlign: 'center',
    marginBottom: 14,
    letterSpacing: 0.3,
    lineHeight: 40,
  },
  subtitle: {
    fontSize: 16,
    color: '#777777',
    textAlign: 'center',
    lineHeight: 26,
  },
  subtitleHighlight: {
    color: '#FF6B35',
    fontWeight: '700',
  },
  chipContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    marginBottom: 10,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFF3ED',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#FFE4D6',
  },
  chipText: {
    fontSize: 13,
    color: '#FF6B35',
    fontWeight: '600',
  },
  bottomSection: {
    marginTop: 10,
  },
});

export default Onboarding1Screen;
