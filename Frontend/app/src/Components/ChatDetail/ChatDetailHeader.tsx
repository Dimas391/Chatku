// components/ChatDetail/ChatDetailHeader.tsx
import React, { useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDimensions } from '@/app/src/utils/dimensions';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface ChatDetailHeaderProps {
  chatName: string;
  chatAvatar: string;
  online: boolean;
  onBackPress: () => void;
  onCallPress: () => void;
  onVideoCallPress: () => void;
  onMenuPress: () => void;  // Pastikan ini ada
}

const ChatDetailHeader = ({
  chatName,
  chatAvatar,
  online,
  onBackPress,
  onCallPress,
  onVideoCallPress,
  onMenuPress,
}: ChatDetailHeaderProps) => {
  const { width } = useWindowDimensions();
  const { DIMENSIONS, SPACING, RADIUS } = useDimensions();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const styles = useMemo(
    () => createStyles(DIMENSIONS, SPACING, RADIUS, colors, insets),
    [DIMENSIONS, SPACING, RADIUS, colors, insets]
  );

  const maxNameWidth =
    width -
    DIMENSIONS.buttonHeightSmall * 4 -
    DIMENSIONS.avatarMedium -
    SPACING.md * 5;

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBackPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={DIMENSIONS.iconMedium}
          color={colors.primary}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.headerInfo} activeOpacity={0.7}>
        <View style={styles.avatarContainer}>
          <Image
            source={{ uri: chatAvatar || 'https://via.placeholder.com/100' }}
            style={styles.headerAvatar}
          />
          {online ? <View style={[styles.headerOnlineIndicator, { borderColor: colors.background }]} /> : null}
        </View>

        <View style={[styles.textContainer, { maxWidth: maxNameWidth }]}>
          <Text
            style={styles.headerName}
            numberOfLines={1}
            ellipsizeMode="tail"
          >
            {chatName || 'Chat'}
          </Text>
          <Text style={styles.headerStatus}>
            {online ? 'Online' : 'Offline'}
          </Text>
        </View>
      </TouchableOpacity>

      <View style={styles.headerActions}>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={onCallPress}
          hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
        >
          <MaterialCommunityIcons
            name="phone"
            size={DIMENSIONS.iconSmall}
            color={colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerAction}
          onPress={onVideoCallPress}
          hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
        >
          <MaterialCommunityIcons
            name="video"
            size={DIMENSIONS.iconSmall}
            color={colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.headerAction}
          onPress={onMenuPress}
          hitSlop={{ top: 10, bottom: 10, left: 5, right: 5 }}
        >
          <MaterialCommunityIcons
            name="dots-vertical"
            size={DIMENSIONS.iconSmall}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const createStyles = (
  DIMENSIONS: any,
  SPACING: any,
  RADIUS: any,
  colors: any,
  insets: any
) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      paddingTop: insets.top + SPACING.sm,
      borderBottomWidth: 1,
      borderBottomColor: colors.border,
      backgroundColor: colors.header,
      width: '100%',
    },
    backButton: {
      width: DIMENSIONS.buttonHeightSmall,
      height: DIMENSIONS.buttonHeightSmall,
      borderRadius: RADIUS.round,
      backgroundColor: colors.surface,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    headerInfo: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      marginHorizontal: SPACING.sm,
      minWidth: 0,
    },
    avatarContainer: {
      position: 'relative',
      marginRight: SPACING.sm,
      flexShrink: 0,
    },
    headerAvatar: {
      width: DIMENSIONS.avatarMedium,
      height: DIMENSIONS.avatarMedium,
      borderRadius: RADIUS.round,
    },
    headerOnlineIndicator: {
      position: 'absolute',
      bottom: 2,
      right: 2,
      width: 12,
      height: 12,
      borderRadius: 6,
      backgroundColor: '#4CAF50',
      borderWidth: 2,
    },
    textContainer: {
      flex: 1,
      minWidth: 0,
    },
    headerName: {
      fontSize: DIMENSIONS.fontMedium,
      lineHeight: DIMENSIONS.fontMedium * 1.1,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
      includeFontPadding: false,
    },
    headerStatus: {
      fontSize: DIMENSIONS.fontTiny,
      color: colors.textTertiary,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      flexShrink: 0,
      gap: SPACING.xs,
    },
    headerAction: {
      width: DIMENSIONS.buttonHeightSmall,
      height: DIMENSIONS.buttonHeightSmall,
      borderRadius: RADIUS.round,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default ChatDetailHeader;