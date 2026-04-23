export type ThreatLevel = 'safe' | 'warning' | 'danger';

export interface SecurityScore {
  overall: number;
  encryption: number;
  authentication: number;
  integrity: number;
}

export interface KeyVerification {
  id: string;
  contactName: string;
  publicKey: string;
  fingerprint: string;
  verified: boolean;
  verifiedAt?: string;
  algorithm: string;
}

export interface ForensicLog {
  id: string;
  timestamp: number;
  event: string;
  category: 'auth' | 'crypto' | 'network' | 'integrity' | 'access';
  severity: 'info' | 'warning' | 'critical';
  detail: string;
  hash: string;
}

export interface SecurityFeature {
  icon: string;
  label: string;
  desc: string;
  color: string;
  active: boolean;
}