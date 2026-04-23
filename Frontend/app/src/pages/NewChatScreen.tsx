import React from 'react';
import {
  View,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  FlatList,
} from 'react-native';
import { useNewChat } from '@/app/src/hooks/useNewChat';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useTranslation } from '@/app/src/hooks/useTranslation';
import SearchBar from '@/app/src/Components/NewChat/SearchBar';
import UserListItem from '@/app/src/Components/NewChat/UserListItem';
import RecentHeader from '@/app/src/Components/NewChat/RecentHeader';
import EmptyState from '@/app/src/Components/NewChat/EmptyState';
import LoadingState from '@/app/src/Components/NewChat/LoadingState';
import { BaseScreen } from '@/app/src/Components/BaseScreen';

const NewChatScreen = () => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();
  
  const {
    searchQuery,
    searchResults,
    loading,
    recentChats,
    loadingRecent,
    handleSearchChange,
    handleUserSelect,
    handleBack,
    clearSearch,
  } = useNewChat();

  return (
    <BaseScreen>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <StatusBar 
          barStyle={isDarkMode ? 'light-content' : 'dark-content'} 
          backgroundColor={colors.background} 
        />
        
        <SafeAreaView style={styles.safeArea}>

          <SearchBar
            value={searchQuery}
            onChangeText={handleSearchChange}
            onClear={clearSearch}
          />

          {/* Content */}
          {searchQuery.length > 0 ? (
            // Search Results
            loading ? (
              <LoadingState text={t('loading_chats') || 'Mencari...'} />
            ) : (
              <FlatList
                data={searchResults}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <UserListItem user={item} onPress={handleUserSelect} />
                )}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <EmptyState
                    icon="account-search"
                    title={t('no_chats') || 'Tidak ada hasil'}
                    subtitle={t('start_conversation') || 'Cari dengan nama atau username'}
                  />
                }
              />
            )
          ) : (
            // Recent Chats
            loadingRecent ? (
              <LoadingState text={t('loading_chats') || 'Memuat...'} />
            ) : (
              <FlatList
                data={recentChats}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                  <UserListItem user={item} onPress={handleUserSelect} />
                )}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={<RecentHeader />}
                ListEmptyComponent={
                  <EmptyState
                    icon="chat-outline"
                    title={t('no_chats') || 'Belum ada chat'}
                    subtitle={t('start_conversation') || 'Cari user untuk memulai percakapan'}
                  />
                }
              />
            )
          )}
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
  listContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 20,
  },
});

export default NewChatScreen;