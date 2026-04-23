import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { useTheme } from '@/app/src/context/ThemeContext';
import { useTranslation } from '@/app/src/hooks/useTranslation';

const { width } = Dimensions.get('window');

interface ChatHeaderProps {
  username: string;
  avatar: string;
}

const ChatHeader = ({ username, avatar }: ChatHeaderProps) => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const handleSettingsPress = () => {
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Settigs',
        params: {},
      })
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.header, borderBottomColor: colors.border }]}>
      <View style={styles.userInfo}>
        <Image source={{ uri: avatar }} style={[styles.avatar, { borderColor: colors.primary }]} />
        <View style={styles.textContainer}>
          <Text style={[styles.greeting, { color: colors.textTertiary }]}>{t('hello')}</Text>
          <Text style={[styles.username, { color: colors.text }]} numberOfLines={1}>
            {username}
          </Text>
        </View>
      </View>
      
      <TouchableOpacity 
        style={styles.settingsButton} 
        onPress={handleSettingsPress}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <MaterialCommunityIcons name="cog" size={24} color={colors.primary} />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: width * 0.06,
    paddingVertical: width * 0.04,
    width: '100%',
    borderBottomWidth: 1,
  },
  userInfo: {
    marginTop: 14,
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  avatar: {
    width: width * 0.12, 
    height: width * 0.12,
    maxWidth: 52,
    maxHeight: 52,
    borderRadius: width * 0.06,
    marginRight: width * 0.03,
    borderWidth: 2,
  },
  greeting: {
    fontSize: width * 0.035, 
  },
  username: {
    fontSize: width * 0.045,
    fontWeight: '700',
  },
  settingsButton: {
    padding: width * 0.02,
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default ChatHeader;