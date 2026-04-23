import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';

export type BottomTabParamList = {
  Chats: undefined;
  Calls: undefined;
  Security: undefined;
  Contacts: undefined;
  Profile: undefined;
};

export type ChatsScreenProps = BottomTabScreenProps<BottomTabParamList, 'Chats'>;
export type CallsScreenProps = BottomTabScreenProps<BottomTabParamList, 'Calls'>;
export type SecurityScreenProps = BottomTabScreenProps<BottomTabParamList, 'Security'>;
export type ContactsScreenProps = BottomTabScreenProps<BottomTabParamList, 'Contacts'>;
export type ProfileScreenProps = BottomTabScreenProps<BottomTabParamList, 'Profile'>;