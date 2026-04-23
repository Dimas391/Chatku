import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';

interface RemoteVideoProps {
  remoteStream: any | null;
  callerName: string;
  isConnected: boolean;
}

const RemoteVideo: React.FC<RemoteVideoProps> = ({ remoteStream, callerName, isConnected }) => {
  const getStreamURL = () => {
    if (!remoteStream) return null;
    if (Platform.OS === 'web') return remoteStream;
    if (typeof remoteStream.toURL === 'function') return remoteStream.toURL();
    return null;
  };

  const streamURL = getStreamURL();

  if (streamURL && isConnected) {
    try {
      const { RTCView } = require('react-native-webrtc');
      return (
        <View style={styles.container}>
          <RTCView
            streamURL={streamURL}
            style={StyleSheet.absoluteFill}
            objectFit="cover"
            zOrder={0}
          />
        </View>
      );
    } catch {
      // fallback
    }
  }

  // Placeholder saat belum ada remote stream
  return (
    <View style={styles.container}>
      <View style={styles.placeholder}>
        <MaterialCommunityIcons name="account-circle" size={80} color="#444" />
        <Text style={styles.name}>{callerName}</Text>
        <Text style={styles.waiting}>
          {isConnected ? 'Menunggu video...' : 'Menghubungkan...'}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#111',
    zIndex: 0,
  },
  placeholder: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  name: {
    color: '#fff',
    fontSize: 22,
    fontWeight: '600',
    marginTop: 12,
  },
  waiting: {
    color: '#888',
    fontSize: 14,
    marginTop: 8,
  },
});

export default RemoteVideo;