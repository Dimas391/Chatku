import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Platform } from 'react-native';

interface RTCViewProps {
  streamURL?: any; // bisa string (native toURL), MediaStream (web), atau object
  style?: any;
  objectFit?: 'cover' | 'contain';
  mirror?: boolean;
  zOrder?: number;
}

// ─── Native (Android/iOS) ─────────────────────────────────────────────────
const NativeRTCView: React.FC<RTCViewProps> = ({
  streamURL,
  style,
  objectFit = 'cover',
  mirror = false,
  zOrder = 0,
}) => {
  try {
    const { RTCView: RNRTCView } = require('react-native-webrtc');
    // react-native-webrtc RTCView menerima string URL dari stream.toURL()
    const url = typeof streamURL === 'string'
      ? streamURL
      : (typeof streamURL?.toURL === 'function' ? streamURL.toURL() : undefined);

    if (!url) return <View style={[styles.fallback, style]} />;

    return (
      <RNRTCView
        streamURL={url}
        style={[styles.video, style]}
        objectFit={objectFit}
        mirror={mirror}
        zOrder={zOrder}
      />
    );
  } catch (error) {
    console.warn('RTCView not available:', error);
    return <View style={[styles.fallback, style]} />;
  }
};

// ─── Web ──────────────────────────────────────────────────────────────────
const WebRTCView: React.FC<RTCViewProps> = ({
  streamURL,
  style,
  objectFit = 'cover',
  mirror = false,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (!videoRef.current || !streamURL) return;
    if (streamURL instanceof MediaStream) {
      videoRef.current.srcObject = streamURL;
    } else if (typeof streamURL === 'string') {
      videoRef.current.src = streamURL;
    }
  }, [streamURL]);

  return (
    <video
      ref={videoRef}
      autoPlay
      playsInline
      muted={false}
      style={{
        width: '100%',
        height: '100%',
        objectFit: objectFit === 'cover' ? 'cover' : 'contain',
        transform: mirror ? 'scaleX(-1)' : 'none',
        ...(typeof style === 'object' ? style : {}),
      }}
    />
  );
};

// ─── Router ───────────────────────────────────────────────────────────────
const RTCView: React.FC<RTCViewProps> = (props) => {
  if (Platform.OS === 'web') return <WebRTCView {...props} />;
  return <NativeRTCView {...props} />;
};

const styles = StyleSheet.create({
  video: { width: '100%', height: '100%' },
  fallback: { backgroundColor: '#333' },
});

export default RTCView;