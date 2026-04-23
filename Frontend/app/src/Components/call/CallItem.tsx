import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Image,
  StyleSheet,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';
import { CallHistoryItem, StatusInfo } from '@/app/src/hooks/Calls';

interface CallItemProps {
  item: CallHistoryItem;
  onPress: (item: CallHistoryItem) => void;
  onLongPress: (id: string) => void;
}

const getStatusInfo = (status: CallHistoryItem['status']): StatusInfo => {
  switch (status) {
    case 'missed':
      return { icon: 'phone-missed', color: '#FF4444', label: 'Tidak terjawab' };
    case 'answered':
      return { icon: 'phone-check', color: '#4CAF50', label: 'Terjawab' };
    case 'outgoing':
      return { icon: 'phone-outgoing', color: '#FF6B35', label: 'Keluar' };
    default:
      return { icon: 'phone', color: '#888', label: '' };
  }
};

const getTypeIcon = (type: CallHistoryItem['type']): string => {
  return type === 'video' ? 'video' : 'phone';
};

export const CallItem: React.FC<CallItemProps> = ({
  item,
  onPress,
  onLongPress,
}) => {
  const { colors } = useTheme();
  const statusInfo = getStatusInfo(item.status);
  const typeIcon = getTypeIcon(item.type);
  const isMissed = item.status === 'missed';

  return (
    <TouchableOpacity
      style={[
        styles.callItem,
        {
          backgroundColor: colors.card,
          borderBottomColor: colors.border,
        }
      ]}
      onPress={() => onPress(item)}
      onLongPress={() => onLongPress(item.id)}
      activeOpacity={0.7}
    >
      <View style={styles.avatarContainer}>
        {item.avatar ? (
          <Image source={{ uri: item.avatar }} style={styles.avatar} />
        ) : (
          <View style={[styles.avatarPlaceholder, { backgroundColor: '#FF6B3520' }]}>
            <Text style={styles.avatarText}>{item.name.charAt(0)}</Text>
          </View>
        )}
        <View style={[styles.statusBadge, { backgroundColor: colors.background }]}>
          <MaterialCommunityIcons name={statusInfo.icon as any} size={12} color={statusInfo.color} />
        </View>
      </View>

      <View style={styles.callInfo}>
        <View style={styles.callHeader}>
          <Text style={[styles.callName, { color: colors.text, fontWeight: isMissed ? '700' : '500' }]}>
            {item.name}
          </Text>
          <Text style={[styles.callTime, { color: colors.textSecondary }]}>
            {item.time}
          </Text>
        </View>
        
        <View style={styles.callMeta}>
          <MaterialCommunityIcons 
            name={statusInfo.icon as any} 
            size={14} 
            color={statusInfo.color} 
            style={styles.metaIcon}
          />
          <Text style={[styles.callStatus, { color: statusInfo.color }]}>
            {statusInfo.label}
          </Text>
          {item.duration && (
            <>
              <Text style={[styles.callDuration, { color: colors.textSecondary }]}>•</Text>
              <Text style={[styles.callDuration, { color: colors.textSecondary }]}>
                {item.duration}
              </Text>
            </>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={[styles.callButton, { backgroundColor: '#FF6B3520' }]}
        onPress={() => onPress(item)}
      >
        <MaterialCommunityIcons name={typeIcon as any} size={22} color="#FF6B35" />
      </TouchableOpacity>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  callItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  avatarContainer: {
    position: 'relative',
    marginRight: 14,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  avatarPlaceholder: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FF6B35',
  },
  statusBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    borderRadius: 12,
    padding: 2,
    borderWidth: 1,
    borderColor: '#fff',
  },
  callInfo: {
    flex: 1,
  },
  callHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  callName: {
    fontSize: 16,
    flex: 1,
  },
  callTime: {
    fontSize: 11,
    marginLeft: 8,
  },
  callMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  metaIcon: {
    marginRight: 2,
  },
  callStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  callDuration: {
    fontSize: 12,
  },
  callButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
});