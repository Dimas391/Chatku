import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import storageService from './storageService';
import api, { getApiUrl } from '../config/api';

// Konfigurasi handler notifikasi saat app di foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

class NotificationService {
  private expoPushToken: string | null = null;
  private isInitialized = false;

  async initialize() {
    if (this.isInitialized) return;
    
    try {
      // Request permission
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        return;
      }
      
      // Set up notification channels for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('default', {
          name: 'default',
          importance: Notifications.AndroidImportance.MAX,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF6B35',
        });
      }
      
      // Get Expo push token
      await this.getExpoPushToken();
      
      this.setupListeners();
      this.isInitialized = true;
    } catch (error) {
    }
  }

  async getExpoPushToken() {
    try {
      if (!Device.isDevice) {
        return;
      }
      
      // PERBAIKAN: Mengambil projectId dengan aman
      let projectId: string | undefined;
      
      if (Constants.expoConfig?.extra?.eas?.projectId) {
        projectId = Constants.expoConfig.extra.eas.projectId;
      } 
      else if ((Constants.manifest as any)?.extra?.eas?.projectId) {
        projectId = (Constants.manifest as any).extra.eas.projectId;
      }
      
      const token = await Notifications.getExpoPushTokenAsync({
        projectId: projectId,
      });
      
      this.expoPushToken = token.data;
      
      // Save token to backend
      const authToken = await storageService.getAccessToken();
      if (authToken && this.expoPushToken) {
        // PERBAIKAN: Gunakan fetch langsung dengan URL dari getApiUrl
        const url = getApiUrl('/users/me/notification-token');
        await fetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            token: this.expoPushToken,
            platform: Platform.OS,
            device_id: Device.osBuildId || Device.modelName || null
          }),
        });
      }
      
      return this.expoPushToken;
    } catch (error) {
    }
  }

  setupListeners() {
    const subscription = Notifications.addNotificationReceivedListener(notification => {
    });

    const responseSubscription = Notifications.addNotificationResponseReceivedListener(response => {
      this.handleNotificationTap(response.notification);
    });

    return () => {
      subscription.remove();
      responseSubscription.remove();
    };
  }

  handleNotificationTap(notification: Notifications.Notification) {
    const data = notification.request.content.data;
    if (data?.chat_id) {
    } else if (data?.call_id) {
    }
  }

  async sendLocalNotification(title: string, body: string, data?: any) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        data,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
      },
      trigger: {
        seconds: 1,
        channelId: 'default',
      } as Notifications.NotificationTriggerInput,
    });
  }

  async sendCallNotification(callerName: string, callType: 'audio' | 'video') {
    await this.sendLocalNotification(
      `Panggilan ${callType === 'video' ? 'Video' : 'Suara'}`,
      `${callerName} sedang menelepon Anda...`,
      { type: 'call', caller_name: callerName, call_type: callType }
    );
  }

  async sendMessageNotification(senderName: string, message: string, chatId: string) {
  
  if (!senderName || !message) {
    return;
  }
  
  await Notifications.scheduleNotificationAsync({
    content: {
      title: `Pesan dari ${senderName}`,
      body: message.length > 100 ? message.substring(0, 100) + '...' : message,
      data: { type: 'message', chat_id: chatId, sender_name: senderName },
      sound: true,
      priority: Notifications.AndroidNotificationPriority.HIGH,
    },
    trigger: null, 
  });
  
}
  async scheduleReminder(chatId: string, message: string, seconds: number) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Pengingat Chat',
        body: message,
        data: { chat_id: chatId, type: 'reminder' },
      },
      trigger: {
        seconds: seconds,
        channelId: 'default',
      } as Notifications.NotificationTriggerInput,
    });
  }

  async cancelAllNotifications() {
    await Notifications.cancelAllScheduledNotificationsAsync();
  }

  async getBadgeCount() {
    return await Notifications.getBadgeCountAsync();
  }

  async setBadgeCount(count: number) {
    await Notifications.setBadgeCountAsync(count);
  }
}

export default new NotificationService();