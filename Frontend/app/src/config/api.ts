// config/api.ts
import Constants from 'expo-constants';
import axios from 'axios';
import storageService from '../services/storageService';

// Ambil Base URL dari environment variable
const getBaseURL = (): string => {
  if (__DEV__) {
    const envUrl = process.env.EXPO_PUBLIC_API_URL;
    if (envUrl) {
      console.log('🌐 Using ENV URL:', envUrl);
      return envUrl;
    }
    const defaultUrl = 'http://192.168.1.5:8000/api/v1';
    console.log('🌐 Using default URL:', defaultUrl);
    return defaultUrl;
  }
  return Constants.expoConfig?.extra?.API_BASE_URL || 'https://api.chatku.com/api/v1';
};

const BASE_URL = getBaseURL();
console.log('Final API Base URL:', BASE_URL);

export const API_CONFIG = {
  baseURL: BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
};

// Ekspor BASE_URL untuk digunakan di file lain
export { BASE_URL };

// EXPORT getApiUrl
export const getApiUrl = (endpoint: string): string => {
  const base = BASE_URL.endsWith('/') ? BASE_URL.slice(0, -1) : BASE_URL;
  const path = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  return `${base}${path}`;
};

// WebSocket URL
export const getWebSocketURL = (): string => {
  if (__DEV__) {
    return 'ws://192.168.1.5:8000';
  }
  return Constants.expoConfig?.extra?.WS_URL || 'wss://api.chatku.com';
};

// Axios instance
const api = axios.create({
  baseURL: BASE_URL,
  timeout: API_CONFIG.timeout,
  headers: API_CONFIG.headers,
});

// Request interceptor
api.interceptors.request.use(
  async (config) => {
    const token = await storageService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    console.log('🚀', config.method?.toUpperCase(), config.url);
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('📥 Response status:', response.status);
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      status: error.response?.status,
      message: error.message,
    });
    return Promise.reject(error);
  }
);

export default api;