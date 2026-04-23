import { useState } from 'react';
import { SecurityScore, KeyVerification, ForensicLog } from '@/app/src/hooks/Secuirty';

// Dummy data
const DUMMY_SCORE: SecurityScore = {
  overall: 94,
  encryption: 100,
  authentication: 88,
  integrity: 97,
};

const DUMMY_KEYS: KeyVerification[] = [
  {
    id: 'k1',
    contactName: 'Ahmad Rizal',
    publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEA...',
    fingerprint: 'A3:F2:91:BC:4E:77:D0:12:88:C5:3A:9F:E1:02:44:B7',
    verified: true,
    verifiedAt: '18 Apr 2026, 14:32',
    algorithm: 'RSA-2048',
  },
  {
    id: 'k2',
    contactName: 'Siti Nurhaliza',
    publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEB...',
    fingerprint: 'B7:1D:34:AA:CF:8E:29:01:77:3C:D4:5B:F3:90:21:E2',
    verified: true,
    verifiedAt: '19 Apr 2026, 09:10',
    algorithm: 'ECDSA-256',
  },
  {
    id: 'k3',
    contactName: 'Budi Santoso',
    publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQEC...',
    fingerprint: 'C1:8B:52:DE:70:3F:44:92:B8:1E:67:A0:D5:2C:F8:93',
    verified: false,
    algorithm: 'RSA-4096',
  },
  {
    id: 'k4',
    contactName: 'Dewi Lestari',
    publicKey: 'MIIBIjANBgkqhkiG9w0BAQEFAAOCAQ8AMIIBCgKCAQED...',
    fingerprint: 'D9:4C:A1:F0:88:2B:56:C3:E5:71:30:B2:7F:9D:14:4A',
    verified: true,
    verifiedAt: '20 Apr 2026, 07:55',
    algorithm: 'ECDSA-256',
  },
];

const DUMMY_LOGS: ForensicLog[] = [
  {
    id: 'l1',
    timestamp: Date.now() - 120000,
    event: 'Message Encrypted',
    category: 'crypto',
    severity: 'info',
    detail: 'AES-256-GCM encryption applied to outgoing message. Session key rotated.',
    hash: 'sha256:4a9f2c81b3e057d6f1c8742a',
  },
  {
    id: 'l2',
    timestamp: Date.now() - 300000,
    event: 'Key Verification Success',
    category: 'integrity',
    severity: 'info',
    detail: 'Public key fingerprint for Dewi Lestari verified via QR scan.',
    hash: 'sha256:7b1d38ca52e409f3a6c9150b',
  },
  {
    id: 'l3',
    timestamp: Date.now() - 900000,
    event: 'Failed Login Attempt',
    category: 'auth',
    severity: 'warning',
    detail: 'Incorrect PIN entered 2 times. Lockout threshold: 5 attempts.',
    hash: 'sha256:2e8f0c44d71b9a357e520461',
  },
  {
    id: 'l4',
    timestamp: Date.now() - 1800000,
    event: 'Biometric Authentication',
    category: 'auth',
    severity: 'info',
    detail: 'User authenticated via fingerprint sensor successfully.',
    hash: 'sha256:9c3b7512e84df0261a7b3900',
  },
  {
    id: 'l5',
    timestamp: Date.now() - 3600000,
    event: 'Suspicious Network Probe',
    category: 'network',
    severity: 'critical',
    detail: 'Unusual packet inspection detected on port 443. Connection blocked.',
    hash: 'sha256:0f5a2e63c9178b4d35124796',
  },
  {
    id: 'l6',
    timestamp: Date.now() - 7200000,
    event: 'Message Integrity Verified',
    category: 'integrity',
    severity: 'info',
    detail: 'HMAC-SHA256 signature validated for chat session chat_2.',
    hash: 'sha256:6d4c1f89b0273e5a8291730c',
  },
  {
    id: 'l7',
    timestamp: Date.now() - 10800000,
    event: 'Session Key Rotation',
    category: 'crypto',
    severity: 'info',
    detail: 'Diffie-Hellman key exchange completed. New session established.',
    hash: 'sha256:3a7e9020d415bc86f5472813',
  },
  {
    id: 'l8',
    timestamp: Date.now() - 14400000,
    event: 'Unauthorized Access Blocked',
    category: 'access',
    severity: 'critical',
    detail: 'Root access attempt detected and denied. System integrity maintained.',
    hash: 'sha256:b8c0572f3e19a6d4071c2958',
  },
];

const SECURITY_FEATURES = [
  { icon: 'lock', label: 'End-to-End Encryption', desc: 'AES-256-GCM + RSA-4096', color: '#FF6B35', active: true },
  { icon: 'fingerprint', label: 'Biometric Auth', desc: 'Fingerprint & Face ID', color: '#4CAF50', active: true },
  { icon: 'key-variant', label: 'Key Verification', desc: 'Public-key infrastructure', color: '#2196F3', active: true },
  { icon: 'file-search', label: 'Digital Forensic Log', desc: 'Tamper-proof audit trail', color: '#9C27B0', active: true },
  { icon: 'message-lock', label: 'Self-Destruct Messages', desc: 'Auto-delete setelah dibaca', color: '#FF9800', active: false },
  { icon: 'incognito', label: 'Stealth Mode', desc: 'Sembunyikan status online', color: '#607D8B', active: true },
];

export const useSecurityData = () => {
  const [keys, setKeys] = useState<KeyVerification[]>(DUMMY_KEYS);
  const [logs] = useState<ForensicLog[]>(DUMMY_LOGS);
  const [score] = useState<SecurityScore>(DUMMY_SCORE);
  const [features] = useState(SECURITY_FEATURES);

  const verifyKey = (keyId: string) => {
    setKeys(prev => prev.map(k =>
      k.id === keyId
        ? { ...k, verified: true, verifiedAt: new Date().toLocaleString('id-ID') }
        : k
    ));
  };

  return {
    keys,
    logs,
    score,
    features,
    verifyKey,
  };
};