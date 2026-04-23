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

type RootStackParamList = {
  Index: undefined;
  Welcome: undefined;
  Dashboard: undefined;
};

type NavigationProp = NativeStackNavigationProp<RootStackParamList, 'Index'>;

const { width, height } = Dimensions.get('window');

const IndexScreen = () => {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
  
    const timer = setTimeout(() => {
      // Ganti 'Dashboard' dengan nama route yang sesuai di navigator Anda
      navigation.reset({
        index: 0,
        routes: [{ name: 'Dashboard' }],
      });
    }, 1500); // Delay 1.5 detik untuk efek loading

    return () => clearTimeout(timer);
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