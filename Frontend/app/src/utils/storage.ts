import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@ChatKu:token';
const REFRESH_TOKEN_KEY = '@ChatKu:refresh_token';

export const StorageService = {
  async saveTokens(accessToken: string, refreshToken: string) {
    try {
      await AsyncStorage.multiSet([
        [TOKEN_KEY, accessToken],
        [REFRESH_TOKEN_KEY, refreshToken],
      ]);
    } catch (error) {
    }
  },

  async getTokens() {
    try {
      const [accessToken, refreshToken] = await AsyncStorage.multiGet([
        TOKEN_KEY,
        REFRESH_TOKEN_KEY,
      ]);
      return {
        accessToken: accessToken[1],
        refreshToken: refreshToken[1],
      };
    } catch (error) {
      return { accessToken: null, refreshToken: null };
    }
  },

  async clearTokens() {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY]);
    } catch (error) {
    }
  },
};