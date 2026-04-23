import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import ChatItem from '@/app/src/Components/ChatItem';
import { ChatItem as ChatItemType } from '@/app/src/hooks/types';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useTranslation } from '@/app/src/hooks/useTranslation';

const { width, height } = Dimensions.get('window');

interface ChatListProps {
  chats: ChatItemType[];
  refreshing?: boolean;
  onRefresh?: () => void;
  loading?: boolean;
}

const ChatList = ({ chats, refreshing = false, onRefresh, loading = false }: ChatListProps) => {
  const { colors } = useTheme();
  const { t } = useTranslation();

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons 
        name="chat-outline" 
        size={Math.min(80, width * 0.2)} 
        color={colors.textTertiary} 
      />
      <Text style={[styles.emptyText, { color: colors.textTertiary }]}>{t('no_chats')}</Text>
      <Text style={[styles.emptySubText, { color: colors.textTertiary }]}>
        {t('start_conversation')}
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textTertiary }]}>{t('loading_chats')}</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={chats}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => <ChatItem chat={item} />}
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.listContent}
      ListEmptyComponent={renderEmptyComponent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary]}
          tintColor={colors.primary}
          progressViewOffset={10}
        />
      }
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
    />
  );
};

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: width * 0.06,
    paddingTop: width * 0.02,
    paddingBottom: height * 0.12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.15,
    minHeight: height * 0.6,
  },
  emptyText: {
    fontSize: width * 0.045,
    fontWeight: '600',
    marginTop: width * 0.04,
  },
  emptySubText: {
    fontSize: width * 0.035,
    marginTop: width * 0.02,
    textAlign: 'center',
    paddingHorizontal: width * 0.1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: height * 0.6,
  },
  loadingText: {
    marginTop: width * 0.04,
    fontSize: width * 0.035,
  },
});

export default ChatList;