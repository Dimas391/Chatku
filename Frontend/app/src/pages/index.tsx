import React, { useEffect } from 'react';
import {
  View,
  Text,
  ActivityIndicator,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import storageService from '@/app/src/services/storageService';

type RootStackParamList = {
  Index: undefined;
  Welcome: undefined;
  Dashboard: undefined;
  MainTabs: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Index'>;

const { width, height } = Dimensions.get('window');

const IndexScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await storageService.getAccessToken();
      
      // Delay sedikit untuk efek splash
      setTimeout(() => {
        navigation.reset({
          index: 0,
          routes: [{ name: token ? 'MainTabs' : 'Dashboard' }],
        });
      }, 1500);
    };

    checkAuth();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Loading Dashboard...</Text>
        <ActivityIndicator 
          size="large" 
          color="#3b5998"
          style={styles.loader}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#333',
    textAlign: 'center',
  },
  loader: {
    marginTop: 10,
  },
});

export default IndexScreen;