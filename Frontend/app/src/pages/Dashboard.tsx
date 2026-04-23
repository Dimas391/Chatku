import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../App';

import BackgroundDecor from '@/app/src/Components/BackgroundDecor';
import Header from '@/app/src/Components/Header';
import ImageSection from '@/app/src/Components/ImageSection';
import TextContent from '@/app/src/Components/TextContent';
import NextButton from '@/app/src/Components/NextButton';

type DashboardScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Dashboard'>;

const DashboardScreen = () => {
  const navigation = useNavigation<DashboardScreenNavigationProp>();

  const navigateToChat = () => {
    navigation.navigate('RegisterScreen');
  };

  const handleBackPress = () => {
    // Handle back navigation
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      <BackgroundDecor />

      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          <Header onBackPress={handleBackPress} currentStep={1} />
          <ImageSection />
          <TextContent />
          <NextButton onPress={navigateToChat} />
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
});

export default DashboardScreen;