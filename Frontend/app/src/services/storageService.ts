import AsyncStorage from '@react-native-async-storage/async-storage';

const TOKEN_KEY = '@SafeChat:access_token';
const REFRESH_TOKEN_KEY = '@SafeChat:refresh_token';
const USER_ID_KEY = '@SafeChat:user_id';
const USER_PROFILE_KEY = '@SafeChat:user_profile';

class StorageService {
  
  async getAccessToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  async getRefreshToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(REFRESH_TOKEN_KEY);
    } catch (error) {
      return null;
    }
  }

  async getUserData(): Promise<any | null> {
    try {
      const profile = await AsyncStorage.getItem(USER_PROFILE_KEY);
      if (profile) {
        return JSON.parse(profile);
      }
      return null;
    } catch (error) {
      return null;
    }
  }

  async saveTokens(accessToken: string, refreshToken: string) {
    try {
      await AsyncStorage.multiSet([
        [TOKEN_KEY, accessToken],
        [REFRESH_TOKEN_KEY, refreshToken],
      ]);
    } catch (error) {
    }
  }

  async saveUserProfile(userProfile: any) {
    try {
      await AsyncStorage.setItem(USER_PROFILE_KEY, JSON.stringify(userProfile));
    } catch (error) {
    }
  }

  async getUserProfile() {
    try {
      const profile = await AsyncStorage.getItem(USER_PROFILE_KEY);
      return profile ? JSON.parse(profile) : null;
    } catch (error) {
      return null;
    }
  }

  async saveUserId(userId: string) {
    try {
      await AsyncStorage.setItem(USER_ID_KEY, userId);
    } catch (error) {
    }
  }

  async getUserId() {
    try {
      return await AsyncStorage.getItem(USER_ID_KEY);
    } catch (error) {
      return null;
    }
  }

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
  }

  async clearTokens() {
    try {
      await AsyncStorage.multiRemove([TOKEN_KEY, REFRESH_TOKEN_KEY, USER_ID_KEY, USER_PROFILE_KEY]);
    } catch (error) {
    }
  }
}

export default new StorageService();