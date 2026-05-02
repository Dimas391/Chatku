import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import ChatScreen from '@/app/src/pages/ChatScreen';
import ProfileScreen from '@/app/src/pages/Profile';
import CallsScreen from '@/app/src/pages/CallsScreen';
import SecurityScreen from '@/app/src/pages/Securityscreen';
import ContactsScreen from '@/app/src/pages/ContactsScreen';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useChat } from '@/app/src/hooks/useChat';

import { BottomTabParamList } from './types';

const Tab = createBottomTabNavigator<BottomTabParamList>();

const Badge: React.FC<{ count: number }> = ({ count }) => {
  if (count === 0) return null;
  return (
    <View style={styles.badgeContainer}>
      <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
    </View>
  );
};

// Konfigurasi tab — terpusat agar mudah dikelola
const TAB_CONFIG: Record<
  string,
  { label: string; icon: string; iconOutline: string; badge?: number }
> = {
  Chats: { label: 'Chats', icon: 'chat', iconOutline: 'chat-outline' },
  Security: { label: 'Keamanan', icon: 'shield-lock', iconOutline: 'shield-lock-outline' },
  Contacts: { label: 'Kontak', icon: 'account-plus', iconOutline: 'account-plus-outline' },
  Profile: { label: 'Saya', icon: 'account-circle', iconOutline: 'account-circle-outline' },
};



const CustomTabBar = ({ state, descriptors, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const { chats } = useChat();
  const BASE_HEIGHT = 70;
  const bottomPad = Math.max(insets.bottom, 8);
  
  const ACTIVE_COLOR = colors.primary || '#FF6B35';
  const INACTIVE_COLOR = colors.textTertiary || '#888';

  // Hitung total unread count secara dinamis
  const totalUnreadCount = chats.reduce((sum, chat) => sum + (chat.unreadCount || 0), 0);

  return (
    <View
      style={[
        styles.customTabBar,
        {
          height: BASE_HEIGHT + bottomPad,
          paddingBottom: bottomPad,
          backgroundColor: colors.card,
          borderTopColor: colors.border,
        },
      ]}
    >
      {state.routes.map((route: any, index: number) => {
        const isFocused = state.index === index;
        const cfg = TAB_CONFIG[route.name] ?? {
          label: route.name,
          icon: 'circle',
          iconOutline: 'circle-outline',
        };

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const iconName = isFocused ? cfg.icon : cfg.iconOutline;
        const color = isFocused ? ACTIVE_COLOR : INACTIVE_COLOR;

        return (
          <TouchableOpacity
            key={route.key}
            onPress={onPress}
            style={styles.customTabItem}
            activeOpacity={0.7}
          >
            <View style={styles.iconWrapper}>
              <MaterialCommunityIcons 
                name={iconName as any} 
                size={28}
                color={color} 
              />
              {route.name === 'Chats' && totalUnreadCount > 0 ? (
                <Badge count={totalUnreadCount} />
              ) : (cfg.badge ? <Badge count={cfg.badge} /> : null)}
            </View>
            <Text style={[styles.customLabel, { color }]} numberOfLines={1}>
              {cfg.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const BottomTabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tab.Screen name="Chats" component={ChatScreen} options={{ title: 'Chats' }} />
      <Tab.Screen name="Security" component={SecurityScreen} options={{ title: 'Keamanan' }} />
      <Tab.Screen name="Contacts" component={ContactsScreen} options={{ title: 'Kontak' }} /> 
      <Tab.Screen name="Profile" component={ProfileScreen} options={{ title: 'Saya' }} />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  customTabBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    paddingTop: 10,
  },
  customTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    paddingVertical: 4,  
  },
  iconWrapper: {
    position: 'relative',
    width: 34,  
    height: 34, 
    justifyContent: 'center',
    alignItems: 'center',
  },
  customLabel: { 
    fontSize: 12,     
    fontWeight: '500', 
    marginTop: 5,     
  },
  badgeContainer: {
    position: 'absolute',
    top: -8,           
    right: -12,       
    backgroundColor: '#FF4444',
    borderRadius: 12,  
    minWidth: 18,     
    height: 18,      
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { 
    color: '#fff', 
    fontSize: 10,     
    fontWeight: 'bold' 
  },
});

export default BottomTabNavigator;