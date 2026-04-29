/**
 * platformStorage.ts
 * Storage abstraction yang bekerja di Mobile (SecureStore) dan Web (localStorage).
 */
import { Platform } from 'react-native';

const IS_WEB = Platform.OS === 'web';

// Lazy import SecureStore hanya di mobile agar tidak crash di web
let SecureStore: any = null;
if (!IS_WEB) {
  SecureStore = require('expo-secure-store');
}

export const platformStorage = {
  async getItem(key: string): Promise<string | null> {
    if (IS_WEB) {
      try {
        return localStorage.getItem(key);
      } catch {
        return null;
      }
    }
    try {
      return await SecureStore.getItemAsync(key);
    } catch {
      // Fallback AsyncStorage jika SecureStore gagal (misal emulator)
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        return await AsyncStorage.getItem(key);
      } catch {
        return null;
      }
    }
  },

  async setItem(key: string, value: string): Promise<void> {
    if (IS_WEB) {
      try {
        localStorage.setItem(key, value);
      } catch (e) {
        console.warn('[PlatformStorage] localStorage.setItem failed:', e);
      }
      return;
    }
    try {
      await SecureStore.setItemAsync(key, value);
    } catch {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.setItem(key, value);
      } catch (e) {
        console.warn('[PlatformStorage] All storage fallbacks failed:', e);
      }
    }
  },

  async removeItem(key: string): Promise<void> {
    if (IS_WEB) {
      try {
        localStorage.removeItem(key);
      } catch {}
      return;
    }
    try {
      await SecureStore.deleteItemAsync(key);
    } catch {
      try {
        const AsyncStorage = require('@react-native-async-storage/async-storage').default;
        await AsyncStorage.removeItem(key);
      } catch {}
    }
  },
};

export default platformStorage;
