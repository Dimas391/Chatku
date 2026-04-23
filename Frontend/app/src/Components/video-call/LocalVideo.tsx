import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface LocalVideoProps {
  localStream: any | null;
  isFrontCamera: boolean;
  isVisible: boolean;
  isFullscreen?: boolean;
  onSwitchCamera: () => void;
}

const LocalVideo: React.FC<LocalVideoProps> = ({
  localStream,
  isFrontCamera,
  isVisible,
  isFullscreen = false,
  onSwitchCamera,
}) => {
  if (!localStream || !isVisible) return null;

  const getStreamURL = () => {
    if (Platform.OS === 'web') return localStream;
    if (typeof localStream.toURL === 'function') return localStream.toURL();
    return localStream;
  };

  const streamURL = getStreamURL();

  const renderVideo = () => {
    try {
      const { RTCView } = require('react-native-webrtc');
      return (
        <RTCView
          streamURL={typeof streamURL === 'string' ? streamURL : undefined}
          style={StyleSheet.absoluteFill}
          objectFit="cover"
          mirror={isFrontCamera}
          zOrder={isFullscreen ? 0 : 1}
        />
      );
    } catch {
      return null;
    }
  };

  if (isFullscreen) {
    return (
      <View style={styles.fullscreen}>
        {renderVideo()}
        {Platform.OS !== 'web' && (
          <TouchableOpacity style={styles.switchBtnFullscreen} onPress={onSwitchCamera}>
            <MaterialCommunityIcons name="camera-switch" size={24} color="#fff" />
          </TouchableOpacity>
        )}
      </View>
    );
  }

  return (
    <View style={styles.smallContainer}>
      {renderVideo()}
      {Platform.OS !== 'web' && (
        <TouchableOpacity style={styles.switchBtnSmall} onPress={onSwitchCamera}>
          <MaterialCommunityIcons name="camera-switch" size={18} color="#fff" />
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111',
    zIndex: 1,
  },
  switchBtnFullscreen: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  smallContainer: {
    position: 'absolute',
    top: 100,
    right: 16,
    width: 110,
    height: 150,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: '#FF6B35',
    backgroundColor: '#222',
    zIndex: 10,
  },
  switchBtnSmall: {
    position: 'absolute',
    bottom: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default LocalVideo;