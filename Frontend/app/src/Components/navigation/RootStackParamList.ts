export type RootStackParamList = {
  MainTabs: undefined;
  Index: undefined;
  Dashboard: undefined;
  Chat: undefined;
  ChatDetailScreen: {
    chatId: string;
    chatName: string;
    chatAvatar: string;
    online?: boolean;
  };
  RegisterScreen: undefined;
  Verification: {
    type: 'phone' | 'email';
    value: string;
    countryCode?: string;
  };
  ProfileSetup: undefined;
  NewChat: undefined;
  Settigs: undefined;
  Profile: undefined;
  PrivacySecurity: undefined;
  About: undefined;
  HelpSupport: undefined;
  PrivacyPolicy: undefined;
  VoiceCall: {
    callId: string;
    chatId: string;
    callerName: string;
    callerAvatar: string;
    isIncoming: boolean;
    calleeId: string;
    callerId: string;
  };
  VideoCall: {
    callId: string;
    chatId: string;
    callerName: string;
    callerAvatar: string;
    isIncoming: boolean;
    calleeId: string;
    callerId: string;
  };
};