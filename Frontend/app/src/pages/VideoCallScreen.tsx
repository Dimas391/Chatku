import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, StyleSheet, Alert, Platform, ActivityIndicator,
  Text, PermissionsAndroid, Linking, TouchableOpacity, Vibration,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import VideoCallHeader from '@/app/src/Components/video-call/VideoCallHeader';
import RemoteVideo from '@/app/src/Components/video-call/RemoteVideo';
import LocalVideo from '@/app/src/Components/video-call/LocalVideo';
import VideoControls from '@/app/src/Components/video-call/VideoControls';
import CallTimer from '@/app/src/Components/call/CallTimer';
import CallAvatar from '@/app/src/Components/call/CallAvatar';
import RingingAnimation from '@/app/src/Components/call/RingingAnimation';
import videoCallService from '@/app/src/services/videoCallService';
import websocketService from '@/app/src/services/websocketService';
import storageService from '@/app/src/services/storageService';
import notificationService from '@/app/src/services/notificationService';

let mediaDevices: any = null;
let RTCPeerConnection: any = null;
let RTCSessionDescription: any = null;

try {
  if (Platform.OS !== 'web') {
    const W = require('react-native-webrtc');
    mediaDevices          = W.mediaDevices;
    RTCPeerConnection     = W.RTCPeerConnection;
    RTCSessionDescription = W.RTCSessionDescription;
  } else {
    mediaDevices          = navigator.mediaDevices;
    RTCPeerConnection     = window.RTCPeerConnection;
    RTCSessionDescription = window.RTCSessionDescription;
  }
} catch (e) {  }

const wsOn   = (e: string, h: (d: any) => void) => { try { (websocketService as any).on(e, h);  } catch (_) {} };
const wsOff  = (e: string, h: (d: any) => void) => { try { (websocketService as any).off(e, h); } catch (_) {} };
const wsSend = (data: any)                       => { try { (websocketService as any).send(data); } catch (_) {} };

interface Params {
  callId: string; chatId: string; callerName: string; callerAvatar: string;
  isIncoming: boolean; calleeId?: string; callerId?: string;
}
type Status = 'ringing' | 'connecting' | 'connected' | 'ended';

const DEFAULT_ICE_SERVERS = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  { urls: 'stun:stun2.l.google.com:19302' },
];

const loadValidIceServers = async (): Promise<any[]> => {
  try {
    const token = await storageService.getAccessToken();
    const res = await fetch('http://192.168.1.3:8000/api/v1/calls/ice-servers', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const data = await res.json();
    
    // Filter hanya server yang valid (pastikan ada urls dan bukan placeholder)
    const validServers = (data.ice_servers || []).filter((server: any) => {
      // Pastikan ada urls
      if (!server.urls || !server.urls.length) return false;
      // Hindari placeholder
      if (server.urls[0].includes('your-turn-server')) return false;
      // Hindari server dengan username null
      if (server.username === null && server.credential === null) return true;
      // Jika ada username, pastikan tidak null
      if (server.username && server.username !== 'null') return true;
      return false;
    });
    
    if (validServers.length > 0) {
      return validServers;
    }
  } catch (error) {
  }
  
  return DEFAULT_ICE_SERVERS;
};


const VideoCallScreen = () => {
  const navigation = useNavigation();
  const route      = useRoute();
  const raw        = route.params as Params | undefined;

  const {
    callId = '', chatId = '', callerName = 'Pengguna', callerAvatar = '',
    isIncoming = false, calleeId = '', callerId = '',
  } = raw || {};

  const [status,       setStatus]       = useState<Status>(isIncoming ? 'ringing' : 'connecting');
  const [isMuted,      setIsMuted]      = useState(false);
  const [isCameraOn,   setIsCameraOn]   = useState(false);
  const [isFrontCam,   setIsFrontCam]   = useState(true);
  const [localStream,  setLocalStream]  = useState<any>(null);
  const [remoteStream, setRemoteStream] = useState<any>(null);
  const [isLoading,    setIsLoading]    = useState(true);
  const [hasPerm,      setHasPerm]      = useState(false);
  const [duration,     setDuration]     = useState(0);

  const pcRef      = useRef<any>(null);
  const localRef   = useRef<any>(null);
  const isMounted  = useRef(true);
  const rtcReady   = useRef(false);
  const iceServers = useRef<any[]>(DEFAULT_ICE_SERVERS);

  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; cleanup(); };
  }, []);

  useEffect(() => { if (!raw?.callId) navigation.goBack(); }, []);

  useEffect(() => {
    if (status === 'ringing' && isIncoming) {
      try { Vibration.vibrate([500, 500, 500], true); } catch (_) {}
    }
    return () => { Vibration.cancel(); };
  }, [status, isIncoming]);

  useEffect(() => {
    const init = async () => {
      const granted = await requestPerms();
      if (!granted) { setIsLoading(false); return; }

      const servers = await loadValidIceServers();
      iceServers.current = servers;

      if (!isMounted.current) return;
      setIsLoading(false);

      if (!isIncoming) {
        await openCamera();
        setTimeout(() => { if (isMounted.current) setupWebRTC(true); }, 800);
      }
      if (isIncoming) {
        notificationService.sendCallNotification(callerName, 'audio');
      }
    };
    init();
  }, []);

  const requestPerms = async (): Promise<boolean> => {
    if (Platform.OS === 'android') {
      const r = await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.CAMERA,
        PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
      ]);
      const ok =
        r[PermissionsAndroid.PERMISSIONS.CAMERA]       === PermissionsAndroid.RESULTS.GRANTED &&
        r[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === PermissionsAndroid.RESULTS.GRANTED;
      if (!ok) {
        Alert.alert('Izin Diperlukan', 'Kamera & mikrofon diperlukan.', [
          { text: 'Batal', onPress: () => navigation.goBack() },
          { text: 'Pengaturan', onPress: () => Linking.openSettings() },
        ]);
        return false;
      }
    }
    if (isMounted.current) setHasPerm(true);
    return true;
  };

  const openCamera = async () => {
    if (!mediaDevices) return;
    try {
      const stream = await mediaDevices.getUserMedia({
        audio: true,
        video: { facingMode: isFrontCam ? 'user' : 'environment' },
      });
      if (!isMounted.current) { stream.getTracks().forEach((t: any) => t.stop()); return; }
      localRef.current = stream;
      setLocalStream(stream);
      setIsCameraOn(true);
    } catch (err) {
      try {
        const s = await mediaDevices.getUserMedia({ audio: true, video: false });
        if (!isMounted.current) { s.getTracks().forEach((t: any) => t.stop()); return; }
        localRef.current = s;
        setLocalStream(s);
        setIsCameraOn(false);
      } catch (_) {}
    }
  };

  const setupWebRTC = async (isCaller: boolean) => {
    if (!RTCPeerConnection || rtcReady.current) return;
    rtcReady.current = true;
    
    try {
      const configuration = {
        iceServers: iceServers.current.map(server => {
          if (typeof server === 'string') {
            return { urls: server };
          }
          return {
            urls: server.urls,
            ...(server.username && { username: server.username }),
            ...(server.credential && { credential: server.credential }),
          };
        }),
      };
      
      pcRef.current = new RTCPeerConnection(configuration);
      
      localRef.current?.getTracks().forEach((t: any) => pcRef.current.addTrack(t, localRef.current));

      pcRef.current.ontrack = (e: any) => {
        if (e.streams?.[0] && isMounted.current) {
          setRemoteStream(e.streams[0]);
        }
      };

      pcRef.current.onicecandidate = (e: any) => {
        if (e.candidate && isMounted.current) {
          wsSend({ event: 'webrtc_signal', data: {
            call_id: callId, type: 'ice-candidate', candidate: e.candidate,
            target_user_id: isCaller ? calleeId : callerId,
          }});
        }
      };

      pcRef.current.onconnectionstatechange = () => {
        const st = pcRef.current?.connectionState;
        if (st === 'connected' && isMounted.current) {
          setStatus('connected');
        }
        if ((st === 'failed' || st === 'disconnected') && isMounted.current) {
          setTimeout(() => { if (pcRef.current?.connectionState === st) endCall(); }, 3000);
        }
      };

      if (isCaller) {
        const offer = await pcRef.current.createOffer();
        await pcRef.current.setLocalDescription(offer);
        wsSend({ event: 'webrtc_signal', data: {
          call_id: callId, type: 'offer', sdp: offer.sdp, target_user_id: calleeId,
        }});
      }
    } catch (err) { 
      rtcReady.current = false;
    }
  };

  useEffect(() => {
    if (!callId) return;
    const onSignal = async (data: any) => {
      if (data?.call_id !== callId) return;
      
      if (data.type === 'offer'          && data.sdp)       await doOffer(data);
      else if (data.type === 'answer'    && data.sdp)       await doAnswer(data);
      else if (data.type === 'ice-candidate' && data.candidate) await doIce(data);
      else if (data.type === 'call_answered' && isMounted.current) {
        setStatus('connected');
      }
      else if (data.type === 'call_ended')    endCall();
      else if (data.type === 'call_declined') { 
        Alert.alert('Ditolak', 'Pengguna menolak panggilan'); 
        endCall();
      }
    };
    const onAnswered = (d: any) => { 
      if (d?.call_id === callId && isMounted.current) {
        setStatus('connected');
      }
    };
    const onEnded    = (d: any) => { if (d?.call_id === callId && isMounted.current) endCall(); };
    
    wsOn('webrtc_signal', onSignal);
    wsOn('call_answered',  onAnswered);
    wsOn('call_ended',     onEnded);
    
    return () => { 
      wsOff('webrtc_signal', onSignal); 
      wsOff('call_answered',  onAnswered); 
      wsOff('call_ended',     onEnded);
    };
  }, [callId]);

  const doOffer = async (data: any) => {
    if (!pcRef.current) await setupWebRTC(false);
    try {
      await pcRef.current?.setRemoteDescription(new RTCSessionDescription({ type: 'offer', sdp: data.sdp }));
      const ans = await pcRef.current?.createAnswer();
      await pcRef.current?.setLocalDescription(ans);
      wsSend({ event: 'webrtc_signal', data: { 
        call_id: callId, type: 'answer', sdp: ans.sdp, target_user_id: callerId 
      }});
    } catch (e) {  }
  };
  
  const doAnswer = async (data: any) => {
    try { 
      await pcRef.current?.setRemoteDescription(new RTCSessionDescription({ type: 'answer', sdp: data.sdp }));
    } catch (e) {  }
  };
  
  const doIce = async (data: any) => {
    try { await pcRef.current?.addIceCandidate(data.candidate); }
    catch (e) { }
  };

  const cleanup = () => {
    try {
      localRef.current?.getTracks().forEach((t: any) => t.stop());
      localRef.current = null;
      pcRef.current?.close();
      pcRef.current = null;
      rtcReady.current = false;
    } catch (_) {}
  };

  const endCall = useCallback(() => {
    if (!isMounted.current) return;
    setStatus('ended');
    Vibration.cancel();
    cleanup();
    setLocalStream(null);
    setRemoteStream(null);
    if (callId) videoCallService.endVideoCall(callId).catch(() => {});
    setTimeout(() => { if (isMounted.current) navigation.goBack(); }, 1000);
  }, [callId, navigation]);

  const acceptCall = async () => {
    if (!isMounted.current) return;
    setStatus('connecting');
    Vibration.cancel();
    try {
      await videoCallService.answerVideoCall(callId);
      wsSend({ event: 'webrtc_signal', data: { 
        call_id: callId, type: 'call_answered', target_user_id: callerId 
      }});
      if (!localRef.current) await openCamera();
      await setupWebRTC(false);
    } catch (err) { 
      endCall();
    }
  };

  const rejectCall = () => {
    Vibration.cancel();
    videoCallService.declineVideoCall(callId).catch(() => {});
    wsSend({ event: 'webrtc_signal', data: { 
      call_id: callId, type: 'call_declined', target_user_id: callerId 
    }});
    endCall();
  };

  const toggleMute = () => {
    const t = localRef.current?.getAudioTracks()?.[0];
    if (t) t.enabled = !isMuted;
    setIsMuted(p => !p);
  };

  const toggleCamera = () => {
    const t = localRef.current?.getVideoTracks()?.[0];
    if (t) { 
      t.enabled = !isCameraOn; 
      setIsCameraOn(p => !p);
    }
  };

  const switchCamera = async () => {
    if (!mediaDevices || !localRef.current) return;
    const nf = !isFrontCam;
    setIsFrontCam(nf);
    try {
      const ns = await mediaDevices.getUserMedia({ 
        audio: false, 
        video: { facingMode: nf ? 'user' : 'environment' }
      });
      const nv = ns.getVideoTracks()[0];
      const ov = localRef.current.getVideoTracks()[0];
      if (ov) { localRef.current.removeTrack(ov); ov.stop(); }
      localRef.current.addTrack(nv);
      const sender = pcRef.current?.getSenders().find((s: any) => s.track?.kind === 'video');
      if (sender) sender.replaceTrack(nv);
      setLocalStream({ ...localRef.current });
    } catch (e) { }
  };

  const handleDurationChange = useCallback((d: number) => setDuration(d), []);

  // ─── Guards ───────────────────────────────────────────────────────────────
  if (!raw?.callId) return (
    <View style={s.container}>
      <Text style={{ color: '#fff', textAlign: 'center', marginTop: 100 }}>Memuat...</Text>
    </View>
  );

  if (isLoading) return (
    <View style={s.container}>
      <View style={s.center}>
        <ActivityIndicator size="large" color="#FF6B35" />
        <Text style={s.loadingTxt}>Memuat panggilan video...</Text>
      </View>
    </View>
  );

  if (!hasPerm) return (
    <View style={s.container}>
      <View style={s.center}>
        <MaterialCommunityIcons name="camera-off" size={64} color="#FF6B35" />
        <Text style={s.errTxt}>Izin kamera & mikrofon diperlukan</Text>
        <TouchableOpacity style={s.settBtn} onPress={() => Linking.openSettings()}>
          <Text style={s.settTxt}>Buka Pengaturan</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[s.settTxt, { color: '#aaa', marginTop: 8 }]}>Kembali</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  // Ringing (penerima) 
  if (status === 'ringing') return (
    <View style={s.container}>
      <View style={s.ringingContainer}>
        <RingingAnimation isRinging={true}>
          <CallAvatar avatarUrl={callerAvatar} name={callerName} size={120} />
        </RingingAnimation>
        <Text style={s.ringingTitle}>{callerName}</Text>
        <Text style={s.ringingSubtitle}>Panggilan Video Masuk</Text>
        <View style={s.ringingBtns}>
          <TouchableOpacity style={[s.callBtn, s.rejectBtn]} onPress={rejectCall}>
            <MaterialCommunityIcons name="phone-hangup" size={32} color="#fff" />
            <Text style={s.btnLabel}>Tolak</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[s.callBtn, s.acceptBtn]} onPress={acceptCall}>
            <MaterialCommunityIcons name="video" size={32} color="#fff" />
            <Text style={s.btnLabel}>Terima</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Logika tampilan video
  const hasRemote = remoteStream !== null && status === 'connected';
  const showLocalFullscreen = !hasRemote && status === 'connecting';

  return (
    <View style={s.container}>

      {/* Remote video — layar penuh (hanya saat connected dan ada remote stream) */}
      {hasRemote && (
        <RemoteVideo
          remoteStream={remoteStream}
          callerName={callerName}
          isConnected={true}
        />
      )}

      {/* Saat belum ada remote stream (connecting): tampilkan placeholder */}
      {!hasRemote && (
        <View style={s.waitingBg}>
          <MaterialCommunityIcons name="account-circle" size={80} color="#333" />
          <Text style={s.waitingName}>{callerName}</Text>
          <Text style={s.waitingStatus}>
            {status === 'connecting' ? 'Menghubungkan...' : 'Menunggu video...'}
          </Text>
        </View>
      )}

      {/* Local video */}
      <LocalVideo
        localStream={localStream}
        isFrontCamera={isFrontCam}
        isVisible={localStream !== null && isCameraOn}
        isFullscreen={showLocalFullscreen}
        onSwitchCamera={switchCamera}
      />

      {/* Header overlay */}
      <VideoCallHeader
        title={status === 'connecting' ? 'Menghubungkan...' : ''}
        onClose={() => {
          if (status === 'connected') {
            Alert.alert('Akhiri Panggilan?', '', [
              { text: 'Batal', style: 'cancel' },
              { text: 'Akhiri', onPress: endCall, style: 'destructive' },
            ]);
          } else {
            endCall();
          }
        }}
      />

      {/* Timer (hanya saat connected) */}
      {status === 'connected' && (
        <View style={s.timerOverlay}>
          <CallTimer isActive={true} onDurationChange={handleDurationChange} />
        </View>
      )}

      {/* Controls */}
      <VideoControls
        callStatus={status}
        isMuted={isMuted}
        isCameraOn={isCameraOn}
        onMuteToggle={toggleMute}
        onCameraToggle={toggleCamera}
        onSwitchCamera={switchCamera}
        onEndCall={endCall}
        onAcceptCall={acceptCall}
        onRejectCall={rejectCall}
      />

      {/* Indikator kamera mati (hanya saat connected) */}
      {status === 'connected' && !isCameraOn && (
        <View style={s.camOff}>
          <MaterialCommunityIcons name="camera-off" size={16} color="#fff" />
          <Text style={s.camOffTxt}>Kamera mati</Text>
        </View>
      )}
    </View>
  );
};

const s = StyleSheet.create({
  container:        { flex: 1, backgroundColor: '#000' },
  center:           { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingTxt:       { marginTop: 16, color: '#fff', fontSize: 16 },
  errTxt:           { marginTop: 16, color: '#FF4444', fontSize: 16, textAlign: 'center' },
  settBtn:          { marginTop: 20, paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#FF6B35', borderRadius: 8 },
  settTxt:          { color: '#fff', fontSize: 14, fontWeight: '600' },

  // Waiting background (saat belum ada remote)
  waitingBg:        { ...StyleSheet.absoluteFillObject, backgroundColor: '#111', justifyContent: 'center', alignItems: 'center', zIndex: 0 },
  waitingName:      { color: '#fff', fontSize: 22, fontWeight: '600', marginTop: 12 },
  waitingStatus:    { color: '#888', fontSize: 14, marginTop: 8 },

  // Ringing
  ringingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#1a1a2e' },
  ringingTitle:     { fontSize: 28, fontWeight: '600', color: '#fff', marginTop: 16 },
  ringingSubtitle:  { fontSize: 16, color: '#aaa', marginTop: 8, marginBottom: 60 },
  ringingBtns:      { flexDirection: 'row', gap: 48 },
  callBtn:          { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center' },
  rejectBtn:        { backgroundColor: '#FF4444' },
  acceptBtn:        { backgroundColor: '#4CAF50' },
  btnLabel:         { color: '#fff', fontSize: 12, marginTop: 4, fontWeight: '500' },

  timerOverlay:     { position: 'absolute', top: 60, left: 0, right: 0, alignItems: 'center', zIndex: 15 },
  camOff:           {
    position: 'absolute', bottom: 120, alignSelf: 'center',
    flexDirection: 'row', backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20,
    alignItems: 'center', gap: 6,
  },
  camOffTxt: { color: '#fff', fontSize: 12 },
});

export default VideoCallScreen;