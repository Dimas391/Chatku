import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useTheme } from '@/app/src/context/ThemeContext';

interface MessageBubbleProps {
  text: string;
  time: string;
  isMe: boolean;
  senderName?: string;
  status?: 'sent' | 'delivered' | 'read' | 'sending';
  classificationLabel?: 'Berisiko' | 'Tidak Berisiko' | null;
  isDestroyed?: boolean;
  isRisky?: boolean;
  isVerified?: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({
  text,
  time,
  isMe,
  senderName,
  status,
  classificationLabel,
  isDestroyed = false,
  isRisky = false,
}) => {
  const { colors } = useTheme();

  const getStatusIcon = () => {
    if (!isMe) return null;
    if (status === 'sending') {
      return <MaterialCommunityIcons name="clock-outline" size={12} color="#888" />;
    }
    switch (status) {
      case 'sent':
        return <MaterialCommunityIcons name="check" size={12} color="#888" />;
      case 'delivered':
        return <MaterialCommunityIcons name="check-all" size={12} color="#888" />;
      case 'read':
        return <MaterialCommunityIcons name="check-all" size={12} color="#4CAF50" />;
      default:
        return null;
    }
  };

  if (isDestroyed) {
    return (
      <View style={[
        styles.container,
        isMe ? styles.myContainer : styles.otherContainer,
        styles.destroyedContainer,
        { backgroundColor: isMe ? '#FF4444' : '#FF444420' }
      ]}>
        {!isMe && senderName && (
          <Text style={[styles.senderName, { color: colors.textSecondary }]}>
            {senderName}
          </Text>
        )}
        
        <View style={styles.destroyedContent}>
          <MaterialCommunityIcons name="shield-alert" size={16} color="#FF4444" />
          <Text style={[styles.destroyedText, { color: '#FF4444' }]}>
            KONTEN BERBAHAYA TELAH DIHANCURKAN OLEH SISTEM
          </Text>
        </View>
        
        <View style={styles.footer}>
          <Text style={[
            styles.timeText,
            { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
          ]}>
            {time}
          </Text>
          <MaterialCommunityIcons name="alert-octagram" size={12} color="#FF4444" />
          {getStatusIcon()}
        </View>
      </View>
    );
  }

  // Normal message display
  return (
    <View style={[
      styles.container,
      isMe ? styles.myContainer : styles.otherContainer,
      { backgroundColor: isMe ? colors.primary : colors.card },
    ]}>
      {!isMe && senderName && (
        <Text style={[styles.senderName, { color: colors.textSecondary }]}>
          {senderName}
        </Text>
      )}
      
      <Text style={[
        styles.messageText,
        { color: isMe ? '#fff' : colors.text }
      ]}>
        {text}
      </Text>
      
      <View style={styles.footer}>
        <Text style={[
          styles.timeText,
          { color: isMe ? 'rgba(255,255,255,0.7)' : colors.textSecondary }
        ]}>
          {time}
        </Text>
        
        {classificationLabel === 'Tidak Berisiko' && (
          <MaterialCommunityIcons 
            name="shield-check" 
            size={12} 
            color={isMe ? 'rgba(255,255,255,0.7)' : '#4CAF50'} 
          />
        )}
        
        {getStatusIcon()}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxWidth: '80%',
  },
  myContainer: {
    borderBottomRightRadius: 4,
  },
  otherContainer: {
    borderBottomLeftRadius: 4,
  },
  senderName: {
    fontSize: 11,
    marginBottom: 2,
  },
  messageText: {
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  timeText: {
    fontSize: 10,
    marginRight: 4,
  },
  destroyedContainer: {
    borderWidth: 1,
    borderColor: '#FF4444',
  },
  destroyedContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginVertical: 4,
  },
  destroyedText: {
    fontSize: 12,
    fontWeight: '600',
    flex: 1,
  },
});

export default MessageBubble;