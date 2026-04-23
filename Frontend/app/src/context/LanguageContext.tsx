import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LANGUAGE_KEY = '@SafeChat:language';

// Translations
const translations = {
  id: {
    // Settings
    settings: 'Pengaturan',
    account: 'AKUN',
    profile: 'Profil Saya',
    privacy_security: 'Privasi & Keamanan',
    appearance: 'TAMPILAN',
    dark_mode: 'Mode Gelap',
    dark_mode_subtitle: 'Sesuaikan tampilan aplikasi',
    language: 'Bahasa',
    others: 'LAINNYA',
    about: 'Tentang Aplikasi',
    help_support: 'Bantuan & Dukungan',
    privacy_policy: 'Kebijakan Privasi',
    logout: 'Keluar',
    version: 'Versi',
    
    // Common
    save: 'Simpan',
    cancel: 'Batal',
    edit: 'Edit',
    delete: 'Hapus',
    back: 'Kembali',
    loading: 'Memuat...',
    error: 'Error',
    success: 'Sukses',
    
    // Language selection
    select_language: 'Pilih Bahasa',
    indonesian: 'Bahasa Indonesia',
    english: 'English',
  },
  en: {
    // Settings
    settings: 'Settings',
    account: 'ACCOUNT',
    profile: 'My Profile',
    privacy_security: 'Privacy & Security',
    appearance: 'APPEARANCE',
    dark_mode: 'Dark Mode',
    dark_mode_subtitle: 'Customize app appearance',
    language: 'Language',
    others: 'OTHERS',
    about: 'About',
    help_support: 'Help & Support',
    privacy_policy: 'Privacy Policy',
    logout: 'Logout',
    version: 'Version',
    
    // Common
    save: 'Save',
    cancel: 'Cancel',
    edit: 'Edit',
    delete: 'Delete',
    back: 'Back',
    loading: 'Loading...',
    error: 'Error',
    success: 'Success',
    
    // Language selection
    select_language: 'Select Language',
    indonesian: 'Indonesian',
    english: 'English',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>('id');

  useEffect(() => {
    loadLanguage();
  }, []);

  const loadLanguage = async () => {
    try {
      const savedLanguage = await AsyncStorage.getItem(LANGUAGE_KEY);
      if (savedLanguage === 'id' || savedLanguage === 'en') {
        setLanguageState(savedLanguage);
      }
    } catch (error) {
      console.error('Error loading language:', error);
    }
  };

  const setLanguage = async (lang: Language) => {
    setLanguageState(lang);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, lang);
    } catch (error) {
      console.error('Error saving language:', error);
    }
  };

  const t = (key: string): string => {
    return translations[language][key as keyof typeof translations[typeof language]] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};