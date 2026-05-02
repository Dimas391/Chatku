import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  Modal,
  TouchableOpacity,
  Image,
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
  onDeleteChat?: (chatId: string) => Promise<boolean>;
}

const ChatList = ({
  chats,
  refreshing = false,
  onRefresh,
  loading = false,
  onDeleteChat,
}: ChatListProps) => {
  const { colors, isDarkMode } = useTheme();
  const { t } = useTranslation();

  const [selectedChat, setSelectedChat] = useState<ChatItemType | null>(null);
  const [isModalVisible, setModalVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleLongPress = (chat: ChatItemType) => {
    setSelectedChat(chat);
    setModalVisible(true);
  };

  const handleCloseModal = () => {
    setModalVisible(false);
    setTimeout(() => setSelectedChat(null), 300);
  };

  const handleConfirmDelete = async () => {
    if (selectedChat && onDeleteChat) {
      setIsDeleting(true);
      const success = await onDeleteChat(selectedChat.id);
      setIsDeleting(false);
      if (success) handleCloseModal();
    }
  };

  const renderSeparator = () => (
    <View style={[styles.separator, { backgroundColor: colors.border }]} />
  );

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIconBox, { backgroundColor: colors.surface }]}>
        <MaterialCommunityIcons
          name="chat-outline"
          size={42}
          color={colors.textTertiary}
        />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>
        Belum ada percakapan
      </Text>
      <Text style={[styles.emptySubtitle, { color: colors.textTertiary }]}>
        Mulai chat baru dengan menekan tombol di bawah
      </Text>
    </View>
  );

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={colors.primary} />
        <Text style={[styles.loadingText, { color: colors.textTertiary }]}>
          Memuat percakapan...
        </Text>
      </View>
    );
  }

  return (
    <>
      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <ChatItem chat={item} onLongPress={handleLongPress} />
        )}
        ItemSeparatorComponent={renderSeparator}
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
        initialNumToRender={12}
        maxToRenderPerBatch={10}
        windowSize={5}
        removeClippedSubviews={true}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        visible={isModalVisible}
        transparent
        animationType="fade"
        onRequestClose={handleCloseModal}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={handleCloseModal}
        >
          <View
            style={[
              styles.modalCard,
              { backgroundColor: isDarkMode ? '#1C1C1E' : '#FFFFFF' },
            ]}
          >
            {/* Avatar besar dari chat yang dipilih */}
            {selectedChat?.avatar ? (
              <Image
                source={{ uri: selectedChat.avatar }}
                style={styles.modalAvatar}
              />
            ) : (
              <View style={[styles.modalAvatarPlaceholder, { backgroundColor: colors.surface }]}>
                <MaterialCommunityIcons name="account" size={36} color={colors.textTertiary} />
              </View>
            )}

            <Text style={[styles.modalName, { color: colors.text }]}>
              {selectedChat?.name}
            </Text>

            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Hapus percakapan ini dari daftar chat Anda?
            </Text>

            {/* Divider */}
            <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />

            {/* Tombol Hapus */}
            <TouchableOpacity
              style={styles.deleteRow}
              onPress={handleConfirmDelete}
              disabled={isDeleting}
            >
              {isDeleting ? (
                <ActivityIndicator size="small" color="#FF6B35" />
              ) : (
                <>
                  <MaterialCommunityIcons name="delete-outline" size={20} color="#FF6B35" />
                  <Text style={styles.deleteText}>Hapus Chat</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Divider */}
            <View style={[styles.modalDivider, { backgroundColor: colors.border }]} />

            {/* Tombol Batal */}
            <TouchableOpacity style={styles.cancelRow} onPress={handleCloseModal}>
              <Text style={[styles.cancelText, { color: colors.text }]}>Batal</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  listContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 4,
    paddingBottom: height * 0.14,
  },
  separator: {
    height: StyleSheet.hairlineWidth,
    marginLeft: 68,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: height * 0.12,
    paddingHorizontal: 40,
  },
  emptyIconBox: {
    width: 84,
    height: 84,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 17,
    fontWeight: '600',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 14,
  },

  // Modal
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 30,
  },
  modalCard: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 20,
    overflow: 'hidden',
    alignItems: 'center',
    paddingTop: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 12,
  },
  modalAvatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    marginBottom: 14,
  },
  modalAvatarPlaceholder: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
  },
  modalName: {
    fontSize: 17,
    fontWeight: '700',
    marginBottom: 6,
  },
  modalMessage: {
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalDivider: {
    width: '100%',
    height: StyleSheet.hairlineWidth,
  },
  deleteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    width: '100%',
  },
  deleteText: {
    color: '#FF6B35',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelRow: {
    paddingVertical: 16,
    width: '100%',
    alignItems: 'center',
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '400',
  },
});

export default ChatList;