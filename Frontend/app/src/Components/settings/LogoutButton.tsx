import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useLanguage } from '@/app/src/context/LanguageContext';

const LogoutButton = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useLanguage();

  const handleLogout = () => {
    Alert.alert(
      'Konfirmasi Logout',
      'Apakah Anda yakin ingin keluar dari aplikasi?',
      [
        { text: t('cancel'), style: 'cancel' },
        {
          text: t('logout'),
          style: 'destructive',
          onPress: async () => {
            await AsyncStorage.clear();
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'Register' }],
              })
            );
          },
        },
      ]
    );
  };

  return (
    <TouchableOpacity style={[styles.container, { borderTopColor: colors.border }]} onPress={handleLogout}>
      <MaterialCommunityIcons name="logout" size={24} color={colors.error} />
      <Text style={[styles.text, { color: colors.error }]}>{t('logout')}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    marginHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderTopWidth: 1,
  },
  text: {
    fontSize: 16,
    fontWeight: '500',
  },
});

export default LogoutButton;