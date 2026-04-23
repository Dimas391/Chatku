import React from 'react';
import { View, StyleSheet } from 'react-native';
import CallActionButton from '@/app/src/Components/call/CallActionButton';

interface VideoControlsProps {
  callStatus: 'ringing' | 'connecting' | 'connected' | 'ended';
  isMuted: boolean;
  isCameraOn: boolean;
  onMuteToggle: () => void;
  onCameraToggle: () => void;
  onSwitchCamera: () => void;
  onEndCall: () => void;
  onAcceptCall?: () => void;
  onRejectCall?: () => void;
}

const VideoControls: React.FC<VideoControlsProps> = ({
  callStatus,
  isMuted,
  isCameraOn,
  onMuteToggle,
  onCameraToggle,
  onSwitchCamera,
  onEndCall,
  onAcceptCall,
  onRejectCall,
}) => {
  return (
    <View style={styles.container}>
      {callStatus === 'ringing' ? (
        <View style={styles.ringingButtons}>
          <CallActionButton
            icon="phone-hangup"
            label="Tolak"
            onPress={onRejectCall || onEndCall}
            variant="reject"
          />
          <CallActionButton
            icon="video"
            label="Terima"
            onPress={onAcceptCall || (() => {})}
            variant="accept"
          />
        </View>
      ) : callStatus === 'connected' ? (
        <View style={styles.connectedControls}>
          <CallActionButton
            icon={isMuted ? 'microphone-off' : 'microphone'}
            label={isMuted ? 'Buka' : 'Mute'}
            onPress={onMuteToggle}
            variant="mute"
            isActive={isMuted}
            size="small"
          />
          <CallActionButton
            icon={isCameraOn ? 'camera' : 'camera-off'}
            label={isCameraOn ? 'Matikan' : 'Hidupkan'}
            onPress={onCameraToggle}
            variant="mute"
            isActive={!isCameraOn}
            size="small"
          />
          <CallActionButton
            icon="camera-switch"
            label="Ganti"
            onPress={onSwitchCamera}
            variant="speaker"
            size="small"
          />
          <CallActionButton
            icon="phone-hangup"
            label="Akhiri"
            onPress={onEndCall}
            variant="end"
            size="small"
          />
        </View>
      ) : callStatus === 'connecting' ? (
        <CallActionButton
          icon="phone-hangup"
          label="Akhiri Panggilan"
          onPress={onEndCall}
          variant="end"
        />
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  ringingButtons: {
    flexDirection: 'row',
    gap: 32,
  },
  connectedControls: {
    flexDirection: 'row',
    gap: 24,
    flexWrap: 'wrap',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
});

export default VideoControls;