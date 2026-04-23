import { useRef, useCallback, useEffect } from 'react';
import { Platform } from 'react-native';

type IceServer = { urls: string | string[]; username?: string; credential?: string };

export interface WebRTCConfig {
  iceServers?: IceServer[];
  onRemoteStream?: (stream: MediaStream) => void;
  onDisconnected?: () => void;
}

export interface WebRTCHook {
  initLocalStream: () => Promise<void>;
  /** Buat offer (caller) → kirim via websocket */
  createOffer: () => Promise<RTCSessionDescriptionInit | null>;
  /** Terima offer & buat answer (callee) */
  createAnswer: (offer: RTCSessionDescriptionInit) => Promise<RTCSessionDescriptionInit | null>;
  /** Set remote answer (caller pakai ini setelah callee kirim answer) */
  setRemoteAnswer: (answer: RTCSessionDescriptionInit) => Promise<void>;
  /** Tambah ICE candidate dari remote peer */
  addIceCandidate: (candidate: RTCIceCandidateInit) => Promise<void>;
  /** Daftarkan callback untuk ICE candidate baru (kirim ke remote via WS) */
  onIceCandidate: (cb: (c: RTCIceCandidateInit) => void) => void;
  /** Toggle mute mikrofon lokal */
  toggleMute: (muted: boolean) => void;
  /** Toggle speaker (mobile) / tidak ada efek di web */
  toggleSpeaker: (on: boolean) => void;
  /** Bersihkan semua resource */
  cleanup: () => void;
}

// ── ICE Servers default (STUN Google + TURN public) ────────────────────────
const DEFAULT_ICE_SERVERS: IceServer[] = [
  { urls: 'stun:stun.l.google.com:19302' },
  { urls: 'stun:stun1.l.google.com:19302' },
  // Tambahkan TURN server production Anda di sini:
  // { urls: 'turn:your-turn-server.com:3478', username: 'user', credential: 'pass' },
];

// ── Deteksi platform ────────────────────────────────────────────────────────
const isWeb = Platform.OS === 'web';

// ── Lazy import react-native-webrtc ────────────────────────────────────────
let RNMediaDevices: any = null;
let RNRTCPeerConnection: any = null;

if (!isWeb) {
  try {
    const rnWebRTC = require('react-native-webrtc');
    RNMediaDevices       = rnWebRTC.mediaDevices;
    RNRTCPeerConnection  = rnWebRTC.RTCPeerConnection;
  } catch (e) {
    console.warn('⚠️ react-native-webrtc tidak terpasang. Install: npm install react-native-webrtc');
  }
}

// ── Ambil API yang sesuai platform ─────────────────────────────────────────
const getMediaDevices = () => isWeb ? navigator.mediaDevices : RNMediaDevices;
const getPeerConnectionClass = () => isWeb ? RTCPeerConnection : RNRTCPeerConnection;

// ── Hook ────────────────────────────────────────────────────────────────────
export function useWebRTC(config: WebRTCConfig = {}): WebRTCHook {
  const { iceServers = DEFAULT_ICE_SERVERS, onRemoteStream, onDisconnected } = config;

  const pcRef          = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const iceCbRef       = useRef<((c: RTCIceCandidateInit) => void) | null>(null);

  // Bersihkan semua resource
  const cleanup = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(t => t.stop());
    localStreamRef.current = null;
    pcRef.current?.close();
    pcRef.current = null;
  }, []);

  useEffect(() => () => cleanup(), [cleanup]);

  // Buat RTCPeerConnection baru
  const createPC = useCallback(() => {
    const PC = getPeerConnectionClass();
    if (!PC) {
      console.error('RTCPeerConnection tidak tersedia. Pastikan react-native-webrtc sudah diinstall.');
      return null;
    }

    const pc = new PC({ iceServers }) as RTCPeerConnection;

    // ICE candidate → kirim ke remote
    pc.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
      if (event.candidate && iceCbRef.current) {
        iceCbRef.current(event.candidate.toJSON());
      }
    };

    // Remote stream → putar audio
    pc.ontrack = (event: RTCTrackEvent) => {
      const [remoteStream] = event.streams;
      if (remoteStream && onRemoteStream) {
        onRemoteStream(remoteStream);

        // Web: otomatis mainkan audio via HTMLAudioElement
        if (isWeb) {
          let audio = document.getElementById('__webrtc_remote_audio') as HTMLAudioElement | null;
          if (!audio) {
            audio = document.createElement('audio');
            audio.id = '__webrtc_remote_audio';
            audio.autoplay = true;
            document.body.appendChild(audio);
          }
          audio.srcObject = remoteStream;
        }
      }
    };

    // Koneksi terputus
    pc.onconnectionstatechange = () => {
      if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
        onDisconnected?.();
      }
    };

    return pc;
  }, [iceServers, onRemoteStream, onDisconnected]);

  // ── initLocalStream ────────────────────────────────────────────────────────
  const initLocalStream = useCallback(async () => {
    const devices = getMediaDevices();
    if (!devices) {
      console.error('mediaDevices tidak tersedia.');
      return;
    }

    try {
      const stream = await devices.getUserMedia({ audio: true, video: false });
      localStreamRef.current = stream;

      // Buat PC baru & tambahkan track
      const pc = createPC();
      if (!pc) return;
      pcRef.current = pc;

      stream.getTracks().forEach((track: MediaStreamTrack) => {
        pc.addTrack(track, stream);
      });
    } catch (err) {
      console.error('Gagal akses mikrofon:', err);
      throw err;
    }
  }, [createPC]);

  // ── createOffer (caller) ───────────────────────────────────────────────────
  const createOffer = useCallback(async (): Promise<RTCSessionDescriptionInit | null> => {
    if (!pcRef.current) return null;
    try {
      const offer = await pcRef.current.createOffer({});
      await pcRef.current.setLocalDescription(offer);
      return offer;
    } catch (err) {
      console.error('createOffer error:', err);
      return null;
    }
  }, []);

  // ── createAnswer (callee) ──────────────────────────────────────────────────
  const createAnswer = useCallback(async (
    offer: RTCSessionDescriptionInit
  ): Promise<RTCSessionDescriptionInit | null> => {
    if (!pcRef.current) return null;
    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await pcRef.current.createAnswer();
      await pcRef.current.setLocalDescription(answer);
      return answer;
    } catch (err) {
      console.error('createAnswer error:', err);
      return null;
    }
  }, []);

  // ── setRemoteAnswer (caller) ───────────────────────────────────────────────
  const setRemoteAnswer = useCallback(async (answer: RTCSessionDescriptionInit) => {
    if (!pcRef.current) return;
    try {
      await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (err) {
      console.error('setRemoteAnswer error:', err);
    }
  }, []);

  // ── addIceCandidate ────────────────────────────────────────────────────────
  const addIceCandidate = useCallback(async (candidate: RTCIceCandidateInit) => {
    if (!pcRef.current) return;
    try {
      await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
    } catch (err) {
      console.error('addIceCandidate error:', err);
    }
  }, []);

  // ── onIceCandidate ─────────────────────────────────────────────────────────
  const onIceCandidate = useCallback((cb: (c: RTCIceCandidateInit) => void) => {
    iceCbRef.current = cb;
  }, []);

  // ── toggleMute ─────────────────────────────────────────────────────────────
  const toggleMute = useCallback((muted: boolean) => {
    localStreamRef.current?.getAudioTracks().forEach(t => { t.enabled = !muted; });
  }, []);

  // ── toggleSpeaker (mobile only) ───────────────────────────────────────────
  const toggleSpeaker = useCallback((on: boolean) => {
    if (isWeb) return; // browser menggunakan output default
    try {
      const { InCallManager } = require('react-native-incall-manager');
      InCallManager.setSpeakerphoneOn(on);
    } catch (e) {
      // react-native-incall-manager opsional
    }
  }, []);

  return {
    initLocalStream,
    createOffer,
    createAnswer,
    setRemoteAnswer,
    addIceCandidate,
    onIceCandidate,
    toggleMute,
    toggleSpeaker,
    cleanup,
  };
}