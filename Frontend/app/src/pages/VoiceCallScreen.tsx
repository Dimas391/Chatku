import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  StyleSheet,
  Vibration,
  Alert,
  Text,
  Platform,
  ActivityIndicator,
  PermissionsAndroid,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import CallHeader from '@/app/src/Components/call/CallHeader';
import CallAvatar from '@/app/src/Components/call/CallAvatar';
import CallerInfo from '@/app/src/Components/call/CallerInfo';
import CallStatus, { CallStatusType } from '@/app/src/Components/call/CallStatus';
import CallTimer from '@/app/src/Components/call/CallTimer';
import RingingAnimation from '@/app/src/Components/call/RingingAnimation';
import CallActionButton from '@/app/src/Components/call/CallActionButton';
import callService from '@/app/src/services/callService';
import websocketService from '@/app/src/services/websocketService';
import notificationService from '@/app/src/services/notificationService';

// Import WebRTC
let mediaDevices: any = null;
let RTCPeerConnection: any = null;
let RTCSessionDescription: any = null;

if (Platform.OS !== 'web') {
  try {
    const WebRTC = require('react-native-webrtc');
    mediaDevices = WebRTC.mediaDevices;
    RTCPeerConnection = WebRTC.RTCPeerConnection;
    RTCSessionDescription = WebRTC.RTCSessionDescription;
  } catch (e) {
    console.log('WebRTC not available:', e);
  } 
} else {
  mediaDevices = navigator.mediaDevices;
  RTCPeerConnection = window.RTCPeerConnection;
  RTCSessionDescription = window.RTCSessionDescription;
}

interface VoiceCallScreenParams {
  callId: string;
  chatId: string;
  callerName: string;
  callerAvatar: string;
  isIncoming: boolean;
  calleeId?: string;
  callerId?: string;
}

const VoiceCallScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const rawParams = route.params as VoiceCallScreenParams | undefined;

  console.log('🎤 VoiceCallScreen MOUNTED with params:', JSON.stringify(rawParams, null, 2));

  const {
    callId = '',
    callerName = 'Pengguna',
    callerAvatar = '',
    isIncoming = false,
    callerId = '',
    calleeId = '',
  } = rawParams || {};

  const [callStatus, setCallStatus] = useState<CallStatusType>(
    isIncoming ? 'ringing' : 'connecting'
  );
  const [callDuration, setCallDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(true);
  const [isLoading, setIsLoading] = useState(true);

  const localStream = useRef<any>(null);
  const peerConnection = useRef<any>(null);
  const isMounted = useRef(true);
  const isWeb = Platform.OS === 'web';
  const hasSetupWebRTC = useRef(false);

  useEffect(() => {
    if (!rawParams?.callId && !isLoading) {
      const timer = setTimeout(() => {
        if (!callId && isMounted.current) {
          console.log('❌ Still no callId, going back');
          navigation.goBack();
        }
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [rawParams?.callId, isLoading]);

  useEffect(() => {
    isMounted.current = true;
    
    const init = async () => {
      if (!isWeb && Platform.OS === 'android') {
        try {
          const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
            {
              title: 'Izin Mikrofon',
              message: 'Aplikasi memerlukan akses mikrofon untuk panggilan suara',
              buttonNeutral: 'Tanya Nanti',
              buttonNegative: 'Tolak',
              buttonPositive: 'Izinkan',
            }
          );
          console.log('Microphone permission:', granted);
        } catch (err) {
          console.log('Permission error:', err);
        }
      }
      
      setIsLoading(false);

      // Kirim notifikasi untuk panggilan masuk
      if (isIncoming) {
        console.log('🔔 Incoming call detected! Sending notification...');
        notificationService.sendCallNotification(callerName, 'audio').catch(err => {
          console.error('Failed to send notification:', err);
        });
      }
      
      if (!isIncoming && !hasSetupWebRTC.current && callId) {
        console.log('📞 Caller mode - setting up WebRTC...');
        setTimeout(() => {
          setupWebRTC(true);
        }, 500);
      }
    };
    
    init();
    
    return () => {
      isMounted.current = false;
      cleanupWebRTC();
    };
  }, [isIncoming, callerName]);

  useEffect(() => {
    if (callId && !isIncoming && !hasSetupWebRTC.current && !isLoading) {
      console.log('📞 callId available, setting up WebRTC...');
      setupWebRTC(true);
    }
  }, [callId, isLoading]);

  // WebSocket listeners untuk signaling
  useEffect(() => {
    if (!callId) return;

    console.log('🎧 Setting up WebSocket listeners for call:', callId);

    const handleWebRTCSignal = async (data: any) => {
      if (data.call_id !== callId) return;
      console.log('📡 WebRTC signal received:', data.type);

      if (data.type === 'offer' && data.sdp) {
        await handleOffer(data);
      } else if (data.type === 'answer' && data.sdp) {
        await handleAnswer(data);
      } else if (data.type === 'ice-candidate' && data.candidate) {
        await handleIceCandidate(data);
      } else if (data.type === 'call_answered') {
        console.log('📞 Call answered!');
        if (isMounted.current) {
          setCallStatus('connected');
        }
      } else if (data.type === 'call_ended') {
        console.log('📞 Call ended');
        endCall();
      } else if (data.type === 'call_declined') {
        console.log('📞 Call declined');
        Alert.alert('Panggilan Ditolak', 'Pengguna menolak panggilan Anda');
        endCall();
      }
    };

    websocketService.on('webrtc_signal', handleWebRTCSignal);
    websocketService.on('call_answered', (data: any) => {
      if (data.call_id === callId && isMounted.current) {
        console.log('📞 call_answered event received');
        setCallStatus('connected');
      }
    });

    return () => {
      websocketService.off('webrtc_signal', handleWebRTCSignal);
    };
  }, [callId]);

  const setupWebRTC = async (isCaller: boolean) => {
    if (hasSetupWebRTC.current) {
      console.log('WebRTC already setup, skipping...');
      return;
    }
    
    if (!mediaDevices || !RTCPeerConnection) {
      console.log('WebRTC not available');
      return;
    }

    console.log('🔧 Setting up WebRTC, isCaller:', isCaller);

    try {
      hasSetupWebRTC.current = true;

      const configuration = {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
        ],
      };

      console.log('🎤 Getting user media...');
      const stream = await mediaDevices.getUserMedia({ audio: true, video: false });
      localStream.current = stream;
      console.log('✅ Got local audio stream');

      peerConnection.current = new RTCPeerConnection(configuration);
      console.log('✅ Peer connection created');

      stream.getTracks().forEach((track: any) => {
        peerConnection.current.addTrack(track, stream);
        console.log('✅ Added track:', track.kind);
      });

      peerConnection.current.ontrack = (event: any) => {
        console.log('🎵 Remote track received');
      };

      peerConnection.current.onicecandidate = (event: any) => {
        if (event.candidate && isMounted.current) {
          console.log('🧊 Sending ICE candidate');
          sendSignal('ice-candidate', { candidate: event.candidate });
        }
      };

      peerConnection.current.onconnectionstatechange = () => {
        const state = peerConnection.current?.connectionState;
        console.log('🔌 Connection state:', state);
        if (state === 'connected' && isMounted.current) {
          console.log('🎉 Call connected!');
          setCallStatus('connected');
        } else if (state === 'failed' || state === 'disconnected') {
          console.log('❌ Call failed/disconnected');
          endCall();
        }
      };

      if (isCaller) {
        console.log('📤 Creating offer...');
        const offer = await peerConnection.current.createOffer();
        await peerConnection.current.setLocalDescription(offer);
        console.log('📤 Sending offer...');
        sendSignal('offer', { sdp: offer.sdp });
      }
    } catch (error) {
      console.error('❌ WebRTC setup error:', error);
      Alert.alert('Error', 'Tidak dapat mengakses mikrofon');
      endCall();
    }
  };

  const handleOffer = async (data: any) => {
    console.log('📥 Handling offer');
    try {
      if (!peerConnection.current) {
        await setupWebRTC(false);
      }
      
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription({ type: 'offer', sdp: data.sdp })
      );
      console.log('✅ Remote description set');
      
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      console.log('📤 Sending answer...');
      sendSignal('answer', { sdp: answer.sdp });
    } catch (error) {
      console.error('❌ Handle offer error:', error);
    }
  };

  const handleAnswer = async (data: any) => {
    console.log('📥 Handling answer');
    try {
      await peerConnection.current.setRemoteDescription(
        new RTCSessionDescription({ type: 'answer', sdp: data.sdp })
      );
      console.log('✅ Remote answer set');
    } catch (error) {
      console.error('❌ Handle answer error:', error);
    }
  };

  const handleIceCandidate = async (data: any) => {
    console.log('🧊 Handling ICE candidate');
    try {
      await peerConnection.current.addIceCandidate(data.candidate);
      console.log('✅ ICE candidate added');
    } catch (error) {
      console.error('❌ ICE candidate error:', error);
    }
  };

  const sendSignal = (type: string, extra: any = {}) => {
    if (!callId) {
      console.log('❌ Cannot send signal: no callId');
      return;
    }
    
    let targetId = '';
    if (isIncoming) {
      targetId = callerId;
    } else {
      targetId = calleeId;
    }
    
    console.log(`📡 Sending ${type} signal to:`, targetId);
    
    websocketService.send({
      event: 'webrtc_signal',
      data: {
        call_id: callId,
        type: type,
        target_user_id: targetId,
        ...extra,
      },
    });
  };

  const cleanupWebRTC = () => {
    console.log('🧹 Cleaning up WebRTC');
    if (localStream.current) {
      localStream.current.getTracks().forEach((track: any) => track.stop());
      localStream.current = null;
    }
    if (peerConnection.current) {
      peerConnection.current.close();
      peerConnection.current = null;
    }
    hasSetupWebRTC.current = false;
  };

  const endCall = useCallback(() => {
    console.log('📞 Ending call...');
    if (!isMounted.current) return;
    setCallStatus('ended');
    Vibration.cancel();
    cleanupWebRTC();
    
    if (callId) {
      callService.endCall(callId).catch(() => {});
      sendSignal('call_ended', {});
    }
    
    setTimeout(() => {
      if (isMounted.current) navigation.goBack();
    }, 1000);
  }, [callId, navigation]);

  const acceptCall = async () => {
    console.log('📞 Accepting call...');
    if (!isMounted.current) return;
    setCallStatus('connecting');
    Vibration.cancel();
    
    try {
      await callService.answerCall(callId);
      console.log('✅ Call answered via API');
      sendSignal('call_answered', {});
      await setupWebRTC(false);
    } catch (error) {
      console.error('❌ Accept call error:', error);
      endCall();
    }
  };

  const rejectCall = () => {
    console.log('📞 Rejecting call...');
    Vibration.cancel();
    if (callId) {
      callService.declineCall(callId).catch(() => {});
      sendSignal('call_declined', {});
    }
    endCall();
  };

  const toggleMute = () => {
    if (localStream.current) {
      const audioTrack = localStream.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMuted;
        console.log('🎤 Mute toggled:', !isMuted);
      }
    }
    setIsMuted(prev => !prev);
  };

  const toggleSpeaker = () => setIsSpeakerOn(prev => !prev);

  const handleDurationChange = useCallback((d: number) => {
    setCallDuration(d);
  }, []);

  const getHeaderTitle = () => {
    switch (callStatus) {
      case 'ringing': return 'Panggilan Masuk';
      case 'connecting': return 'Menghubungkan...';
      case 'connected': return 'Sedang Berbicara';
      default: return 'Panggilan Berakhir';
    }
  };

  // Vibrate incoming
  useEffect(() => {
    if (callStatus === 'ringing' && isIncoming) {
      Vibration.vibrate([1000, 1000, 1000], true);
    }
    return () => Vibration.cancel();
  }, [callStatus, isIncoming]);

  if (!callId) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Memulai panggilan...</Text>
        </View>
      </View>
    );
  }

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Memuat panggilan...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CallHeader title={getHeaderTitle()} onClose={endCall} />

      <View style={styles.content}>
        <RingingAnimation isRinging={callStatus === 'ringing'}>
          <CallAvatar avatarUrl={callerAvatar} name={callerName} size={120} />
        </RingingAnimation>

        <CallerInfo name={callerName} />

        {callStatus === 'connected' ? (
          <CallTimer isActive={true} onDurationChange={handleDurationChange} />
        ) : (
          <CallStatus status={callStatus} duration={callDuration} />
        )}

        {callStatus === 'ringing' && (
          <View style={styles.ringingButtons}>
            <CallActionButton
              icon="phone-hangup"
              label="Tolak"
              onPress={rejectCall}
              variant="reject"
            />
            <CallActionButton
              icon="phone"
              label="Terima"
              onPress={acceptCall}
              variant="accept"
            />
          </View>
        )}

        {callStatus === 'connected' && (
          <View style={styles.connectedButtons}>
            <CallActionButton
              icon={isMuted ? 'microphone-off' : 'microphone'}
              label={isMuted ? 'Buka Suara' : 'Mute'}
              onPress={toggleMute}
              variant="mute"
              isActive={isMuted}
              size="small"
            />
            <CallActionButton
              icon={isSpeakerOn ? 'volume-high' : 'volume-off'}
              label="Speaker"
              onPress={toggleSpeaker}
              variant="speaker"
              isActive={isSpeakerOn}
              size="small"
            />
            <CallActionButton
              icon="phone-hangup"
              label="Akhiri"
              onPress={endCall}
              variant="end"
              size="small"
            />
          </View>
        )}

        {(callStatus === 'connecting' || (callStatus === 'ringing' && !isIncoming)) && (
          <CallActionButton
            icon="phone-hangup"
            label="Akhiri Panggilan"
            onPress={endCall}
            variant="end"
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  ringingButtons: {
    flexDirection: 'row',
    gap: 32,
    marginTop: 20,
  },
  connectedButtons: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 20,
  },
  loadingText: {
    marginTop: 16,
    color: '#fff',
    fontSize: 16,
  },
});

export default VoiceCallScreen;