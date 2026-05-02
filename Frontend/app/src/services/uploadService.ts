// services/uploadService.ts
import storageService from './storageService';

class UploadService {
  async uploadAvatar(uri: string, fileName: string): Promise<string | null> {
    try {
      const token = await storageService.getAccessToken();
      if (!token) {
        throw new Error('Token tidak ditemukan');
      }

      const formData = new FormData();
      formData.append('file', {
        uri: uri,
        name: fileName,
        type: 'image/jpeg',
      } as any);
      
      // Gunakan URL langsung, jangan pakai API_CONFIG
      const baseUrl = 'http://192.168.1.3:8000';
      const uploadUrl = `${baseUrl}/api/v1/users/me/avatar`;
      
      console.log('📤 Upload URL:', uploadUrl);

      const response = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept': 'application/json',
        },
        body: formData,
      });

      const data = await response.json();
      
      if (response.ok && data.avatar_url) {
        return data.avatar_url;
      } else {
        throw new Error(data.detail || 'Gagal mengupload foto');
      }
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  }
}

export default new UploadService();