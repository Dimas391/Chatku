import React, { useEffect, useRef, useMemo } from 'react';
import {
  FlatList,
  View,
  Image,
  StyleSheet,
  Text,
  Animated,
  Platform,
  useWindowDimensions,
} from 'react-native';
import MessageBubble from '@/app/src/Components/ChatDetail/MessageBubble';
import { useDimensions } from '@/app/src/utils/dimensions';
import { scaleWidth } from '@/app/src/utils/responsive';

interface Message {
  id: string;
  text: string;
  time: string;
  senderId: string;
  senderName?: string;
  senderAvatar?: string;
  isMe: boolean;
  status?: 'sent' | 'delivered' | 'read';
}

interface MessageListProps {
  messages: Message[];
  chatAvatar: string;
  flatListRef: React.RefObject<FlatList<any> | null>;
  isTyping?: boolean;
}

const MessageList = ({
  messages,
  chatAvatar,
  flatListRef,
  isTyping,
}: MessageListProps) => {
  const typingAnimation = useRef(new Animated.Value(0)).current;
  const { width } = useWindowDimensions();
  const { DIMENSIONS, SPACING, RADIUS } = useDimensions();

  const styles = useMemo(
    () => createStyles(DIMENSIONS, SPACING, RADIUS, width),
    [DIMENSIONS, SPACING, RADIUS, width]
  );

  useEffect(() => {
    let animationLoop: Animated.CompositeAnimation | null = null;

    if (isTyping) {
      animationLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(typingAnimation, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(typingAnimation, {
            toValue: 0,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      );
      animationLoop.start();
    } else {
      typingAnimation.stopAnimation();
      typingAnimation.setValue(0);
    }

    return () => {
      animationLoop?.stop();
      typingAnimation.stopAnimation();
    };
  }, [isTyping, typingAnimation]);

  const renderMessage = ({ item, index }: { item: Message; index: number }) => {
    const showAvatar =
      !item.isMe &&
      (index === 0 || messages[index - 1]?.senderId !== item.senderId);

    const maxMessageWidth = DIMENSIONS.isTablet
      ? Math.min(scaleWidth(420, width), width * 0.7)
      : width * 0.8;

    return (
      <View
        style={[
          styles.messageRow,
          item.isMe ? styles.myMessageRow : styles.otherMessageRow,
        ]}
      >
        {!item.isMe ? (
          <View style={styles.avatarWrapper}>
            {showAvatar ? (
              <Image
                source={{ uri: item.senderAvatar || chatAvatar }}
                style={styles.messageAvatar}
              />
            ) : (
              <View style={styles.avatarPlaceholder} />
            )}
          </View>
        ) : null}

        <View
          style={[
            styles.messageWrapper,
            item.isMe ? styles.myMessageWrapper : styles.otherMessageWrapper,
            { maxWidth: maxMessageWidth },
          ]}
        >
          <MessageBubble
            text={item.text}
            time={item.time}
            isMe={item.isMe}
            senderName={item.senderName}
            status={item.status}
          />
        </View>
      </View>
    );
  };

  const renderTypingIndicator = () => {
    if (!isTyping) return null;

    const typingWidth = Math.min(scaleWidth(100, width), width * 0.3);

    return (
      <View style={[styles.messageRow, styles.otherMessageRow]}>
        <View style={styles.avatarWrapper}>
          <Image source={{ uri: chatAvatar }} style={styles.messageAvatar} />
        </View>

        <View style={[styles.messageWrapper, { maxWidth: typingWidth }]}>
          <View style={styles.typingBubble}>
            <View style={styles.typingDots}>
              {[0, 1, 2].map((i) => (
                <Animated.View
                  key={i}
                  style={[
                    styles.typingDot,
                    {
                      opacity: typingAnimation.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.3, i === 1 ? 1 : 0.5],
                      }),
                      transform: [
                        {
                          translateY: typingAnimation.interpolate({
                            inputRange: [0, 1],
                            outputRange: [0, i === 1 ? -3 : 0],
                          }),
                        },
                      ],
                    },
                  ]}
                />
              ))}
            </View>
          </View>
        </View>
      </View>
    );
  };

  const renderEmptyComponent = () => (
    <View style={styles.emptyContainer}>
      <Image
        source={{ uri: 'https://via.placeholder.com/200' }}
        style={styles.emptyImage}
      />
      <Text style={styles.emptyText}>Belum ada pesan</Text>
      <Text style={styles.emptySubText}>
        Mulai percakapan dengan sapaan hangat
      </Text>
    </View>
  );

  return (
    <FlatList
      ref={flatListRef}
      data={messages}
      keyExtractor={(item) => item.id}
      renderItem={renderMessage}
      contentContainerStyle={[
        styles.messagesList,
        messages.length === 0 ? styles.emptyList : null,
      ]}
      showsVerticalScrollIndicator={false}
      ListEmptyComponent={renderEmptyComponent}
      ListFooterComponent={renderTypingIndicator}
      onContentSizeChange={() => {
        if (messages.length > 0) {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
      }}
      onLayout={() => {
        if (messages.length > 0) {
          flatListRef.current?.scrollToEnd({ animated: false });
        }
      }}
      maxToRenderPerBatch={20}
      windowSize={10}
      removeClippedSubviews={Platform.OS === 'android'}
    />
  );
};

const createStyles = (
  DIMENSIONS: ReturnType<typeof useDimensions>['DIMENSIONS'],
  SPACING: ReturnType<typeof useDimensions>['SPACING'],
  RADIUS: ReturnType<typeof useDimensions>['RADIUS'],
  screenWidth: number
) =>
  StyleSheet.create({
    messagesList: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.lg,
      flexGrow: 1,
    },
    emptyList: {
      flexGrow: 1,
      justifyContent: 'center',
    },
    emptyContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: SPACING.xxl,
    },
    emptyImage: {
      width: Math.min(scaleWidth(120, screenWidth), screenWidth * 0.3),
      height: Math.min(scaleWidth(120, screenWidth), screenWidth * 0.3),
      marginBottom: SPACING.lg,
      opacity: 0.5,
    },
    emptyText: {
      fontSize: DIMENSIONS.fontLarge,
      fontWeight: '600',
      color: '#999999',
      marginBottom: SPACING.sm,
    },
    emptySubText: {
      fontSize: DIMENSIONS.fontSmall,
      color: '#CCCCCC',
      textAlign: 'center',
      paddingHorizontal: SPACING.xl,
    },
    messageRow: {
      flexDirection: 'row',
      marginBottom: SPACING.sm,
      alignItems: 'flex-end',
    },
    myMessageRow: {
      justifyContent: 'flex-end',
    },
    otherMessageRow: {
      justifyContent: 'flex-start',
    },
    avatarWrapper: {
      width: DIMENSIONS.avatarSmall,
      marginRight: SPACING.sm,
      flexShrink: 0,
    },
    messageAvatar: {
      width: DIMENSIONS.avatarSmall,
      height: DIMENSIONS.avatarSmall,
      borderRadius: RADIUS.round,
    },
    avatarPlaceholder: {
      width: DIMENSIONS.avatarSmall,
      height: DIMENSIONS.avatarSmall,
    },
    messageWrapper: {
      flex: 1,
      minWidth: 0,
    },
    myMessageWrapper: {
      alignItems: 'flex-end',
    },
    otherMessageWrapper: {
      alignItems: 'flex-start',
    },
    typingBubble: {
      backgroundColor: '#F5F5F5',
      borderRadius: RADIUS.lg,
      borderBottomLeftRadius: RADIUS.xs,
      paddingHorizontal: SPACING.lg,
      paddingVertical: SPACING.md,
      alignSelf: 'flex-start',
    },
    typingDots: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
    },
    typingDot: {
      width: scaleWidth(8, screenWidth),
      height: scaleWidth(8, screenWidth),
      borderRadius: RADIUS.round,
      backgroundColor: '#FF6B35',
      marginHorizontal: scaleWidth(2, screenWidth),
    },
  });

export default MessageList;