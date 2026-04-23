import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface CallActionButtonProps {
  icon: string;
  label: string;
  onPress: () => void;
  variant?: 'accept' | 'reject' | 'end' | 'mute' | 'speaker';
  isActive?: boolean;
  size?: 'small' | 'large';
}

const CallActionButton: React.FC<CallActionButtonProps> = ({
  icon,
  label,
  onPress,
  variant = 'accept',
  isActive = false,
  size = 'large',
}) => {
  const getButtonStyle = () => {
    switch (variant) {
      case 'accept': return styles.acceptButton;
      case 'reject': return styles.rejectButton;
      case 'end': return styles.endButton;
      default: return styles.defaultButton;
    }
  };

  const getIconColor = () => {
    if (variant === 'accept' || variant === 'reject' || variant === 'end') return '#fff';
    if (isActive) return '#fff';
    return '#fff';
  };

  const isLarge = size === 'large';
  const buttonSize = isLarge ? 64 : 56; 
  const iconSize = isLarge ? 30 : 24;

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={[
          styles.buttonCircle,
          { width: buttonSize, height: buttonSize, borderRadius: buttonSize / 2 },
          getButtonStyle(),
          isActive && styles.activeButton,
        ]}
        onPress={onPress}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name={icon as any} size={iconSize} color={getIconColor()} />
      </TouchableOpacity>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80, 
  },
  buttonCircle: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8, 
    elevation: 4,   
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  acceptButton: {
    backgroundColor: '#22c55e',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  endButton: {
    backgroundColor: '#ef4444',
  },
  defaultButton: {
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  activeButton: {
    backgroundColor: '#FF6B35', 
  },
  label: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default CallActionButton;