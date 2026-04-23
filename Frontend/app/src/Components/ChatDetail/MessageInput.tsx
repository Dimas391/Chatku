import React, {  useMemo } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Text,
  Platform,
  useWindowDimensions,
  KeyboardAvoidingView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useDimensions } from '@/app/src/utils/dimensions';
import { scaleWidth } from '@/app/src/utils/responsive';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useTranslation } from '@/app/src/hooks/useTranslation';

const HEADER_HEIGHT = 56;

interface MessageInputProps {
  value: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onAttach: () => void;
  isTyping?: boolean;
  placeholder?: string;
}

const MessageInput = ({
  value,
  onChangeText,
  onSend,
  onAttach,
  isTyping,
  placeholder,
}: MessageInputProps) => {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { DIMENSIONS, SPACING, RADIUS } = useDimensions();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const styles = useMemo(
    () => createStyles(DIMENSIONS, SPACING, RADIUS, width, insets, colors),
    [DIMENSIONS, SPACING, RADIUS, width, insets, colors]
  );

  const hasText = value.trim().length > 0;
  const isSmallDevice = width < 375;
  const inputPlaceholder = placeholder || t('send_message');

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? HEADER_HEIGHT + insets.top : 0}
      style={styles.container}
    >
      {isTyping && (
        <View style={styles.typingContainer}>
          <Text style={[styles.typingText, { color: colors.primary }]}>{t('typing')}</Text>
        </View>
      )}
      <View style={styles.inputWrapper}>
        <View style={styles.inputContainer}>
          <TouchableOpacity
            style={[styles.attachButton, { backgroundColor: colors.surface }]}
            onPress={onAttach}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="plus"
              size={DIMENSIONS.iconMedium}
              color={colors.primary}
            />
          </TouchableOpacity>

          <TextInput
            style={[
              styles.input,
              { 
                backgroundColor: colors.surface,
                color: colors.text,
              },
              isSmallDevice ? styles.inputSmall : null
            ]}
            placeholder={inputPlaceholder}
            placeholderTextColor={colors.textTertiary}
            value={value}
            onChangeText={onChangeText}
            multiline
            maxLength={1000}
            textAlignVertical="center"
            returnKeyType="send"
            blurOnSubmit={false}
            onSubmitEditing={hasText ? onSend : undefined}
          />

          <TouchableOpacity
            style={[
              styles.sendButton,
              !hasText ? styles.sendButtonDisabled : null,
            ]}
            onPress={onSend}
            disabled={!hasText}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            activeOpacity={0.7}
          >
            <LinearGradient
              colors={hasText ? [colors.primary, colors.primaryLight] : ['#CCCCCC', '#DDDDDD']}
              style={styles.sendGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
            >
              <MaterialCommunityIcons
                name="send"
                size={DIMENSIONS.iconSmall}
                color="#FFFFFF"
              />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

const createStyles = (
  DIMENSIONS: ReturnType<typeof useDimensions>['DIMENSIONS'],
  SPACING: ReturnType<typeof useDimensions>['SPACING'],
  RADIUS: ReturnType<typeof useDimensions>['RADIUS'],
  screenWidth: number,
  insets: { bottom: number; top: number; left: number; right: number },
  colors: any
) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.background,
      width: '100%',
      flexShrink: 0,
    },
    typingContainer: {
      paddingHorizontal: SPACING.md,
      paddingBottom: SPACING.xs,
    },
    typingText: {
      fontSize: DIMENSIONS.fontTiny,
      fontStyle: 'italic',
    },
    inputWrapper: {
      borderTopWidth: 1,
      borderTopColor: colors.border,
      backgroundColor: colors.background,
      paddingHorizontal: SPACING.md,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.sm,
      width: '100%',
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: SPACING.sm,
    },
    attachButton: {
      width: DIMENSIONS.buttonHeightSmall,
      height: DIMENSIONS.buttonHeightSmall,
      borderRadius: RADIUS.round,
      justifyContent: 'center',
      alignItems: 'center',
      flexShrink: 0,
    },
    input: {
      flex: 1,
      borderRadius: RADIUS.lg,
      paddingHorizontal: SPACING.md,
      paddingVertical: SPACING.sm,
      maxHeight: Math.min(scaleWidth(100, screenWidth), 120),
      minHeight: DIMENSIONS.buttonHeightSmall,
      fontSize: DIMENSIONS.fontRegular,
      paddingTop: SPACING.sm,
      paddingBottom: SPACING.sm,
    },
    inputSmall: {
      fontSize: DIMENSIONS.fontSmall,
      paddingHorizontal: SPACING.sm,
    },
    sendButton: {
      width: DIMENSIONS.buttonHeightSmall,
      height: DIMENSIONS.buttonHeightSmall,
      borderRadius: RADIUS.round,
      overflow: 'hidden',
      flexShrink: 0,
    },
    sendButtonDisabled: {
      opacity: 0.5,
    },
    sendGradient: {
      width: '100%',
      height: '100%',
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

export default MessageInput;