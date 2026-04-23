import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  Dimensions,
} from 'react-native';
import { useChat } from '@/app/src/hooks/useChat';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useLanguage } from '@/app/src/context/LanguageContext';

// Import komponen
import ChatHeader from '@/app/src/Components/ChatHeader';
import ChatSearch from '@/app/src/Components/ChatSearch';
import ChatList from '@/app/src/Components/ChatList';
import ChatFAB from '@/app/src/Components/ChatFAB';
import { BaseScreen } from '@/app/src/Components/BaseScreen';

const { width, height } = Dimensions.get('window');

const ChatScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const { t, language } = useLanguage();
  const {
    chats,
    searchQuery,
    setSearchQuery,
    loading,
    refreshing,
    userProfile,
    handleRefresh,
    handleNewChat,
  } = useChat();

  return (
    <BaseScreen>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={colors.background} />
        
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.contentContainer}>
            {/* Header dengan data user real */}
            <ChatHeader 
              username={userProfile.username}
              avatar={userProfile.avatar}
            />

            {/* Search Bar */}
            <ChatSearch 
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
            />

            {/* Chat List dengan refresh control */}
            <ChatList 
              chats={chats} 
              refreshing={refreshing}
              onRefresh={handleRefresh}
              loading={loading}
            />

            {/* FAB */}
            <ChatFAB onPress={handleNewChat} />
          </View>
        </SafeAreaView>
      </View>
    </BaseScreen>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  contentContainer: {
    flex: 1,
    width: '100%',
    maxWidth: 600, 
    alignSelf: 'center',
  },
});

export default ChatScreen;