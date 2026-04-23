import React, { useMemo } from 'react';
import { View, Text, StyleSheet, useWindowDimensions } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDimensions } from '@/app/src/utils/dimensions';
import { scaleWidth } from '@/app/src/utils/responsive';
import { useTheme } from '@/app/src/context/ThemeContext';

interface MessageBubbleProps {
  text: string;
  time: string;
  isMe: boolean;
  senderName?: string;
  status?: 'sent' | 'delivered' | 'read';
}

const MessageBubble = ({
  text,
  time,
  isMe,
  senderName,
  status,
}: MessageBubbleProps) => {
  const { width } = useWindowDimensions();
  const { DIMENSIONS, SPACING, RADIUS } = useDimensions();
  const { colors, isDarkMode } = useTheme();

  const styles = useMemo(
    () => createStyles(DIMENSIONS, SPACING, RADIUS, colors),
    [DIMENSIONS, SPACING, RADIUS, colors]
  );

  const maxBubbleWidth = DIMENSIONS.isTablet
    ? Math.min(scaleWidth(400, width), width * 0.65)
    : width * 0.75;

  return (
    <View
      style={[
        styles.messageBubble,
        { maxWidth: maxBubbleWidth },
        isMe ? styles.myMessageBubble : styles.otherMessageBubble,
      ]}
    >
      {!isMe && senderName && senderName !== 'Anda' ? (
        <Text style={[styles.senderName, { color: colors.primary }]} numberOfLines={1}>
          {senderName}
        </Text>
      ) : null}

      <Text
        style={[
          styles.messageText,
          isMe ? styles.myMessageText : styles.otherMessageText,
        ]}
      >
        {text}
      </Text>

      <View style={styles.messageFooter}>
        <Text
          style={[
            styles.messageTime,
            isMe ? styles.myMessageTime : styles.otherMessageTime,
          ]}
        >
          {time}
        </Text>

        {isMe && status ? (
          <MaterialCommunityIcons
            name={status === 'read' ? 'check-all' : 'check'}
            size={DIMENSIONS.fontSmall}
            color={status === 'read' ? '#4FC3F7' : colors.textTertiary}
            style={styles.messageStatus}
          />
        ) : null}
      </View>
    </View>
  );
};

const createStyles = (
  DIMENSIONS: ReturnType<typeof useDimensions>['DIMENSIONS'],
  SPACING: ReturnType<typeof useDimensions>['SPACING'],
  RADIUS: ReturnType<typeof useDimensions>['RADIUS'],
  colors: any
) =>
  StyleSheet.create({
    messageBubble: {
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      borderRadius: RADIUS.lg,
      elevation: 1,
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.05,
      shadowRadius: 2,
    },
    myMessageBubble: {
      backgroundColor: colors.primary,
      borderBottomRightRadius: RADIUS.xs,
      alignSelf: 'flex-end',
    },
    otherMessageBubble: {
      backgroundColor: colors.surface,
      borderBottomLeftRadius: RADIUS.xs,
      alignSelf: 'flex-start',
    },
    senderName: {
      fontSize: DIMENSIONS.fontTiny,
      fontWeight: '600',
      marginBottom: SPACING.xs,
      maxWidth: '100%',
    },
    messageText: {
      fontSize: DIMENSIONS.fontRegular,
      lineHeight: DIMENSIONS.fontRegular * 1.4,
      marginBottom: SPACING.xs,
    },
    myMessageText: {
      color: '#FFFFFF',
    },
    otherMessageText: {
      color: colors.text,
    },
    messageFooter: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'flex-end',
      alignSelf: 'flex-end',
    },
    messageTime: {
      fontSize: Math.max(DIMENSIONS.fontTiny - 1, 10),
    },
    myMessageTime: {
      color: 'rgba(255,255,255,0.7)',
    },
    otherMessageTime: {
      color: colors.textTertiary,
    },
    messageStatus: {
      marginLeft: SPACING.xs,
    },
  });

export default MessageBubble;