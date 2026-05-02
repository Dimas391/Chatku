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
}

const ChatDetailHeader = ({
  chatName,
  chatAvatar,
  online,
  onBackPress,
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
    DIMENSIONS.buttonHeightSmall * 2 -
    DIMENSIONS.avatarMedium -
    SPACING.md * 5;

  // Ambil inisial nama untuk fallback avatar
  const getInitials = (name: string) => {
    if (!name || name === 'Chat') return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return name.slice(0, 2).toUpperCase();
  };

  // Warna avatar berdasarkan nama
  const getAvatarColor = (name: string) => {
    const colorList = ['#FF6B35', '#6C63FF', '#00B894', '#E17055', '#0984E3', '#A29BFE', '#FD79A8', '#55EFC4'];
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash += name.charCodeAt(i);
    return colorList[hash % colorList.length];
  };

  const [avatarError, setAvatarError] = React.useState(false);
  const showFallback = avatarError || !chatAvatar || chatAvatar === '';

  return (
    <View style={styles.header}>
      <TouchableOpacity
        style={styles.backButton}
        onPress={onBackPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name="arrow-left"
          size={DIMENSIONS.iconMedium}
          color={colors.primary}
        />
      </TouchableOpacity>

      <TouchableOpacity style={styles.headerInfo} activeOpacity={0.7}>
        <View style={styles.avatarContainer}>
          {showFallback ? (
            <View style={[styles.headerAvatar, styles.avatarFallback, { backgroundColor: getAvatarColor(chatName || 'Chat') }]}>
              <Text style={styles.initialsText}>{getInitials(chatName || 'Chat')}</Text>
            </View>
          ) : (
            <Image
              source={{ uri: chatAvatar }}
              style={styles.headerAvatar}
              onError={() => setAvatarError(true)}
            />
          )}
          {online && (
            <View style={[styles.headerOnlineIndicator, { borderColor: colors.header }]} />
          )}
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
      paddingTop: insets.top,
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
    avatarFallback: {
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#6C63FF',
    },
    initialsText: {
      color: '#FFFFFF',
      fontSize: DIMENSIONS.fontMedium,
      fontWeight: '700',
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
      lineHeight: DIMENSIONS.fontMedium * 1.2,
      fontWeight: '600',
      color: colors.text,
      marginBottom: 2,
      includeFontPadding: false,
    },
    headerStatus: {
      fontSize: DIMENSIONS.fontTiny,
      color: colors.textTertiary,
    },

  });

export default ChatDetailHeader;