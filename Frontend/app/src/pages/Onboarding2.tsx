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

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Onboarding2'>;

const Onboarding2Screen = () => {
  const navigation = useNavigation<NavigationProp>();

  const navigateNext = () => {
    navigation.navigate('Onboarding3');
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <BackgroundDecor />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Header onBackPress={handleBackPress} currentStep={2} totalSteps={3} />

          {/* Illustration Section */}
          <View style={styles.illustrationContainer}>
            <Image
              source={require('@/assets/onboarding_privacy.png')}
              style={styles.image}
              resizeMode="contain"
            />
          </View>

          {/* Text Section */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Privasi{'\n'}Terlindungi</Text>
            <Text style={styles.subtitle}>
              Data pribadimu tidak pernah disimpan{'\n'}
              di server. <Text style={styles.subtitleHighlight}>Chatku</Text> dirancang{'\n'}
              agar privasimu selalu terjaga.
            </Text>
          </View>

          {/* Feature chips */}
          <View style={styles.chipContainer}>
            <View style={styles.chip}>
              <MaterialCommunityIcons name="database-off-outline" size={16} color="#FF6B35" />
              <Text style={styles.chipText}>Zero-Storage</Text>
            </View>
            <View style={styles.chip}>
              <MaterialCommunityIcons name="incognito" size={16} color="#FF6B35" />
              <Text style={styles.chipText}>Anti-Forensik</Text>
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
    width: '114%',
    height: '100%',
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

export default Onboarding2Screen;
