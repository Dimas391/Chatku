const API_URL = import.meta.env.VITE_API_URL || 'http://192.168.1.84:8000/api/v1';
const WS_URL = import.meta.env.VITE_WS_URL || 'ws://192.168.1.84:8000';
const UPLOAD_URL = import.meta.env.VITE_UPLOAD_URL || 'http://192.168.1.84:8000/uploads';

export const API_CONFIG = {
  BASE_URL: API_URL,
  WS_URL: WS_URL,
  UPLOAD_URL: UPLOAD_URL,
  TIMEOUT: 30000,
};

export const getFullUrl = (path: string): string => {
  return `${API_CONFIG.BASE_URL}${path}`;
};