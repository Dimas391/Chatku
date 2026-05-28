/**
 * encryptionService.ts — Universal (Mobile + Web)
 *
 * Mobile : react-native-rsa-native (RSA PKCS1v15) + react-native-aes-crypto (AES-CBC)
 * Web    : node-forge              (RSA PKCS1v15) + Web Crypto API              (AES-CBC)
 * Storage: expo-secure-store (mobile) | localStorage (web)  via platformStorage
 */

import { Platform } from 'react-native';
import { platformStorage } from '../utils/platformStorage';

const IS_WEB = Platform.OS === 'web';

/**
 * Ekstrak body base64 dari PEM (hapus semua header/footer).
 * Dipakai untuk normalisasi key format di mobile.
 */
function _extractPemBody(pem: string): string {
  return pem
    .replace(/-----BEGIN [^-]+-----/g, '')
    .replace(/-----END [^-]+-----/g, '')
    .replace(/[\r\n\s]/g, '');
}


// ── Lazy imports (prevent crash on unsupported platform) ──────────────────
let RSA: any = null;
let RNAesCrypto: any = null;
let ExpoCrypto: any = null;
// forge dimuat di semua platform: Web (enkripsi) + Mobile (konversi key format)
let forge: any = null;
try { forge = require('node-forge'); } catch (_) {}

if (!IS_WEB) {
  RSA = require('react-native-rsa-native').RSA;
  RNAesCrypto = require('react-native-aes-crypto').default;
  ExpoCrypto = require('expo-crypto');
}

// ─────────────────────────────────────────────────────────────────────────

export interface EncryptedMessagePayload {
  ciphertext: string;
  encryptedKey: string;
  encryptedSenderKey: string;
  iv: string;
  hash: string;
  timestamp: number;
}

// ── Helper: buffer <-> base64 ─────────────────────────────────────────────
function bufferToBase64(buffer: ArrayBuffer): string {
  return btoa(String.fromCharCode(...new Uint8Array(buffer)));
}

function base64ToBuffer(b64: string): ArrayBuffer {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// ─────────────────────────────────────────────────────────────────────────

class EncryptionService {
  private myPrivateKey: string | null = null;
  private myPublicKey: string | null = null;
  private serverPublicKey: string | null = null;
  private sessionKey: string | null = null;

  // ═══════════════════════ KEY MANAGEMENT ═══════════════════════════════

  async generateUserKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    console.log('[RSA] Generating user key pair... (platform:', Platform.OS, ')');

    let publicKey: string;
    let privateKey: string;

    if (IS_WEB) {
      // ── Web: node-forge RSA 2048 ──────────────────────────────────────
      const keypair = await new Promise<{ publicKey: string; privateKey: string }>((resolve, reject) => {
        console.log('[RSA] Starting generation (sync)...');
        forge.pki.rsa.generateKeyPair({ bits: 2048, workers: 0 }, (err: any, kp: any) => {
          if (err) { reject(err); return; }

          // Private key: standard PKCS#8 PEM
          const priv = forge.pki.privateKeyToPem(kp.privateKey);

          // Public key: SPKI format (BEGIN PUBLIC KEY) which is compatible with Android react-native-rsa-native
          const pub = forge.pki.publicKeyToPem(kp.publicKey);

          resolve({ publicKey: pub, privateKey: priv });
        });
      });
      publicKey = keypair.publicKey;
      privateKey = keypair.privateKey;
    } else {
      // ── Mobile: react-native-rsa-native ───────────────────────────────
      // generateKeys() menghasilkan public key dalam format PKCS#1 (BEGIN RSA PUBLIC KEY)
      // Kita normalisasi ke SPKI (BEGIN PUBLIC KEY) agar RSA.encrypt() di Android tidak crash
      const kp = await RSA.generateKeys(2048);
      privateKey = kp.private;
      // Konversi PKCS#1 ke SPKI menggunakan forge (via helper) agar struktur DER benar
      publicKey = this._formatPublicKeyPem(kp.public);
      console.log('[RSA] Mobile public key generated and normalized to SPKI format');
    }

    this.myPublicKey = publicKey;
    this.myPrivateKey = privateKey;

    await platformStorage.setItem('user_private_key', privateKey);
    await platformStorage.setItem('user_public_key', publicKey);

    console.log('[RSA] Key pair generated and saved.');
    return { publicKey, privateKey };
  }

  async loadUserKeys(): Promise<boolean> {
    console.log('[RSA] Loading user keys... (platform:', Platform.OS, ')');
    const priv = await platformStorage.getItem('user_private_key');
    const pub  = await platformStorage.getItem('user_public_key');

    if (!priv || !pub) return false;



    this.myPrivateKey = priv;
    this.myPublicKey  = pub;

    console.log('[RSA] Keys loaded — hasPriv: true | hasPub: true');
    return true;
  }

  async getMyPublicKey(): Promise<string | null> {
    if (!this.myPublicKey) await this.loadUserKeys();
    return this.myPublicKey;
  }

  async getMyPrivateKey(): Promise<string | null> {
    if (!this.myPrivateKey) await this.loadUserKeys();
    return this.myPrivateKey;
  }

  async setServerPublicKey(publicKey: string): Promise<void> {
    this.serverPublicKey = publicKey;
  }

  async getServerPublicKey(): Promise<string | null> {
    return this.serverPublicKey;
  }

  // ═══════════════════════ AES ════════════════════════════════════════════

  async generateAESKey(): Promise<string> {
    if (IS_WEB) {
      const arr = new Uint8Array(32);
      crypto.getRandomValues(arr);
      const key = bufferToBase64(arr.buffer);
      console.log('[AES] Generated AES key (web), length:', key.length);
      return key;
    }
    const randomBytes = await ExpoCrypto.getRandomBytesAsync(32);
    const { Buffer } = require('buffer');
    const key = Buffer.from(randomBytes).toString('base64');
    console.log('[AES] Generated AES key (mobile), length:', key.length);
    return key;
  }

  async generateIV(): Promise<string> {
    if (IS_WEB) {
      const arr = new Uint8Array(16);
      crypto.getRandomValues(arr);
      const iv = bufferToBase64(arr.buffer);
      console.log('[AES] Generated IV (web), length:', iv.length);
      return iv;
    }
    const ivBytes = await ExpoCrypto.getRandomBytesAsync(16);
    const { Buffer } = require('buffer');
    const iv = Buffer.from(ivBytes).toString('base64');
    console.log('[AES] Generated IV (mobile), length:', iv.length);
    return iv;
  }

  async encryptAES(plaintext: string, keyBase64: string, ivBase64: string): Promise<string> {
    console.log('[AES] Encrypting, plaintext length:', plaintext.length);

    if (IS_WEB) {
      return this._webAesEncrypt(plaintext, keyBase64, ivBase64);
    }

    // Mobile
    const { Buffer } = require('buffer');
    const keyHex = Buffer.from(keyBase64, 'base64').toString('hex');
    const ivHex  = Buffer.from(ivBase64,  'base64').toString('hex');
    const ciphertext = await RNAesCrypto.encrypt(plaintext, keyHex, ivHex, 'aes-256-cbc');
    console.log('[AES] Encrypted (mobile), ciphertext length:', ciphertext.length);
    return ciphertext;
  }

  async decryptAES(ciphertext: string, keyBase64: string, ivBase64: string): Promise<string> {
    console.log('[AES] Decrypting, ciphertext length:', ciphertext.length);

    if (IS_WEB) {
      return this._webAesDecrypt(ciphertext, keyBase64, ivBase64);
    }

    // Mobile
    const { Buffer } = require('buffer');
    const keyHex = Buffer.from(keyBase64, 'base64').toString('hex');
    const ivHex  = Buffer.from(ivBase64,  'base64').toString('hex');
    const plaintext = await RNAesCrypto.decrypt(ciphertext, keyHex, ivHex, 'aes-256-cbc');
    console.log('[AES] Decrypted (mobile), plaintext length:', plaintext.length);
    return plaintext;
  }

  // ── Web AES-CBC via Web Crypto API ─────────────────────────────────────

  private async _webAesEncrypt(plaintext: string, keyBase64: string, ivBase64: string): Promise<string> {
    const keyBuf = base64ToBuffer(keyBase64);
    const ivBuf  = base64ToBuffer(ivBase64);
    const cryptoKey = await crypto.subtle.importKey('raw', keyBuf, { name: 'AES-CBC' }, false, ['encrypt']);
    const encoded   = new TextEncoder().encode(plaintext);
    const encrypted = await crypto.subtle.encrypt({ name: 'AES-CBC', iv: ivBuf }, cryptoKey, encoded);
    const result = bufferToBase64(encrypted);
    console.log('[AES] Encrypted (web), ciphertext length:', result.length);
    return result;
  }

  private async _webAesDecrypt(ciphertext: string, keyBase64: string, ivBase64: string): Promise<string> {
    const keyBuf = base64ToBuffer(keyBase64);
    const ivBuf  = base64ToBuffer(ivBase64);
    const cipherBuf = base64ToBuffer(ciphertext);
    const cryptoKey = await crypto.subtle.importKey('raw', keyBuf, { name: 'AES-CBC' }, false, ['decrypt']);
    const decrypted  = await crypto.subtle.decrypt({ name: 'AES-CBC', iv: ivBuf }, cryptoKey, cipherBuf);
    const result = new TextDecoder().decode(decrypted);
    console.log('[AES] Decrypted (web), plaintext length:', result.length);
    return result;
  }

  // ═══════════════════════ RSA ════════════════════════════════════════════

  async encryptWithRSA(plaintext: string, publicKeyPem: string): Promise<string> {
    console.log('[RSA] Encrypting with RSA, plaintext length:', plaintext.length);

    if (IS_WEB) {
      return this._forgeRsaEncrypt(plaintext, publicKeyPem);
    }

    // Mobile: react-native-rsa-native
    const formattedKey = this._formatPublicKeyPem(publicKeyPem);
    const encrypted = await RSA.encrypt(plaintext, formattedKey);
    console.log('[RSA] Encrypted (mobile), ciphertext length:', encrypted.length);
    return encrypted;
  }

  async decryptWithRSA(ciphertext: string, privateKeyPem: string): Promise<string> {
    console.log('[RSA] Decrypting with RSA, ciphertext length:', ciphertext.length);

    if (IS_WEB) {
      return this._forgeRsaDecrypt(ciphertext, privateKeyPem);
    }

    // Mobile: react-native-rsa-native
    const decrypted = await RSA.decrypt(ciphertext, privateKeyPem);
    console.log('[RSA] Decrypted (mobile), plaintext length:', decrypted.length);
    return decrypted;
  }

  // ── node-forge RSA (web) ───────────────────────────────────────────────
  // react-native-rsa-native (iOS) uses .rsaEncryptionPKCS1 = PKCS1v1.5
  // Source: RSAECNative.swift line 341-344: SecKeyCreateEncryptedData(publicKey, .rsaEncryptionPKCS1, ...)

  private _forgeRsaEncrypt(plaintext: string, publicKeyPem: string): string {
    // node-forge: publicKeyFromPem() handles SPKI (BEGIN PUBLIC KEY)
    // Untuk PKCS#1 (BEGIN RSA PUBLIC KEY), kita harus parse manual sequence [n, e]
    let publicKey: any;
    if (publicKeyPem.includes('BEGIN RSA PUBLIC KEY')) {
      const der = forge.util.decode64(
        publicKeyPem
          .replace(/-----BEGIN RSA PUBLIC KEY-----/g, '')
          .replace(/-----END RSA PUBLIC KEY-----/g, '')
          .replace(/\s/g, '')
      );
      const asn1 = forge.asn1.fromDer(der);
      // PKCS#1 Public Key adalah Sequence dari [n, e]
      const nBuf = asn1.value[0].value;
      const eBuf = asn1.value[1].value;
      const n = new forge.jsbn.BigInteger(forge.util.bytesToHex(nBuf), 16);
      const e = new forge.jsbn.BigInteger(forge.util.bytesToHex(eBuf), 16);
      publicKey = forge.pki.setRsaPublicKey(n, e);
    } else {
      publicKey = forge.pki.publicKeyFromPem(publicKeyPem);
    }
    // PKCS1v1.5 — Harus sama persis dengan react-native-rsa-native (iOS & Android)
    // yang hardcode menggunakan PKCS1Padding.
    const encrypted = publicKey.encrypt(plaintext, 'RSAES-PKCS1-V1_5');
    const result = forge.util.encode64(encrypted);
    console.log('[RSA] Encrypted (web/forge PKCS1v15), length:', result.length);
    return result;
  }

  private _forgeRsaDecrypt(ciphertext: string, privateKeyPem: string): string {
    const privateKey = forge.pki.privateKeyFromPem(privateKeyPem);
    const decoded    = forge.util.decode64(ciphertext);

    // Coba beberapa algoritma secara berurutan karena perbedaan platform (iOS/Android/web)
    const attempts = [
      // 1. OAEP SHA-1 — Standar modern, sering jadi default di Android
      () => privateKey.decrypt(decoded, 'RSA-OAEP', {
        md: forge.md.sha1.create(),
        mgf1: { md: forge.md.sha1.create() },
      }),
      // 2. PKCS1v1.5 — Digunakan react-native-rsa-native iOS (.rsaEncryptionPKCS1)
      () => privateKey.decrypt(decoded, 'RSAES-PKCS1-V1_5'),
      // 3. OAEP SHA-256 — Fallback terakhir
      () => privateKey.decrypt(decoded, 'RSA-OAEP', {
        md: forge.md.sha256.create(),
        mgf1: { md: forge.md.sha1.create() },
      }),
    ];

    let lastError: any;
    for (let i = 0; i < attempts.length; i++) {
      try {
        const decrypted = attempts[i]();
        console.log(`[RSA] Decrypted (web/forge attempt ${i + 1}), length:`, decrypted.length);
        return decrypted;
      } catch (e) {
        lastError = e;
        console.warn(`[RSA] Attempt ${i + 1} failed:`, (e as any)?.message);
      }
    }
    throw lastError ?? new Error('RSA decrypt failed with all padding schemes');
  }

  // ── PEM Format Helper (Mobile only) ───────────────────────────────────

  /**
   * Normalisasi RSA public key ke format SPKI (BEGIN PUBLIC KEY).
   *
   * react-native-rsa-native generateKeys() menghasilkan PKCS#1 (BEGIN RSA PUBLIC KEY).
   * Android RSA.encrypt() membutuhkan SPKI.
   *
   * Konversi menggunakan node-forge ASN.1 parser — ini cara yang BENAR karena:
   * - Forge parse modulus (n) dan exponent (e) dari PKCS#1 DER
   * - Forge rebuild sebagai SPKI dengan struktur DER yang benar
   * - Tidak sekadar mengganti label header PEM
   */
  private _formatPublicKeyPem(pem: string): string {
    // Sudah SPKI — langsung pakai, tapi validasi dulu (auto-heal bug versi sebelumnya)
    if (pem.includes('BEGIN PUBLIC KEY') && !pem.includes('BEGIN RSA PUBLIC KEY')) {
      if (forge) {
        try {
          // Coba parse sebagai SPKI, jika sukses maka format sudah benar
          forge.pki.publicKeyFromPem(pem);
          return pem;
        } catch (e) {
          console.warn('[RSA] Deteksi key corrupt di storage (SPKI header + PKCS#1 body). Mencoba auto-heal...');
          try {
            const body = _extractPemBody(pem);
            const der = forge.util.decode64(body);
            const asn1 = forge.asn1.fromDer(der);
            const nHex = forge.util.bytesToHex(asn1.value[0].value);
            const eHex = forge.util.bytesToHex(asn1.value[1].value);
            const n = new forge.jsbn.BigInteger(nHex, 16);
            const e = new forge.jsbn.BigInteger(eHex, 16);
            const key = forge.pki.setRsaPublicKey(n, e);
            const spki = forge.pki.publicKeyToPem(key);
            console.log('[RSA] Auto-heal berhasil');
            return spki;
          } catch (healErr) {
            console.error('[RSA] Auto-heal gagal:', healErr);
          }
        }
      }
      return pem;
    }

    // PKCS#1 — konversi ke SPKI menggunakan forge
    if (pem.includes('BEGIN RSA PUBLIC KEY') && forge) {
      try {
        console.log('[RSA] Konversi PKCS#1 → SPKI via forge ASN.1...');
        const body = _extractPemBody(pem);
        const der = forge.util.decode64(body);
        const asn1 = forge.asn1.fromDer(der);
        // PKCS#1 SEQUENCE { INTEGER(n), INTEGER(e) }
        const nHex = forge.util.bytesToHex(asn1.value[0].value);
        const eHex = forge.util.bytesToHex(asn1.value[1].value);
        const n = new forge.jsbn.BigInteger(nHex, 16);
        const e = new forge.jsbn.BigInteger(eHex, 16);
        const key = forge.pki.setRsaPublicKey(n, e);
        const spki = forge.pki.publicKeyToPem(key); // Selalu menghasilkan BEGIN PUBLIC KEY
        console.log('[RSA] Konversi PKCS#1→SPKI berhasil');
        return spki;
      } catch (err) {
        console.error('[RSA] Forge konversi gagal:', err);
      }
    }

    // Tanpa header — tambah SPKI header (key mungkin sudah SPKI body)
    if (!pem.includes('BEGIN')) {
      return `-----BEGIN PUBLIC KEY-----\n${pem}\n-----END PUBLIC KEY-----`;
    }

    // Fallback: kembalikan apa adanya dan biarkan native lib coba handle
    console.warn('[RSA] _formatPublicKeyPem: format tidak dikenal, dikembalikan apa adanya');
    return pem;
  }

  // ═══════════════════════ HASHING ════════════════════════════════════════

  async hashMessage(message: string): Promise<string> {
    if (IS_WEB) {
      const encoded = new TextEncoder().encode(message);
      const hashBuf = await crypto.subtle.digest('SHA-256', encoded);
      return Array.from(new Uint8Array(hashBuf))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    }
    // Mobile: expo-crypto
    const hash = await ExpoCrypto.digestStringAsync(
      ExpoCrypto.CryptoDigestAlgorithm.SHA256,
      message
    );
    return hash;
  }

  async encryptMessage(
    message: string,
    recipientPublicKey: string,
  ): Promise<EncryptedMessagePayload> {
    console.log('🔐 [ENCRYPT] Starting encryption... platform:', Platform.OS);
    console.log('🔐 [ENCRYPT] Message length:', message.length);

    const aesKey = await this.generateAESKey();
    const iv = await this.generateIV();
    const hash = await this.hashMessage(message);

    console.log('🔐 [ENCRYPT] Keys and IV generated');

    const ciphertext = await this.encryptAES(message, aesKey, iv);
    const encryptedKey = await this.encryptWithRSA(aesKey, recipientPublicKey);

    // Encrypt the AES key for the sender themselves so they can read their own message later
    const myPublicKey = await this.getMyPublicKey();
    let encryptedSenderKey = '';
    if (myPublicKey) {
      encryptedSenderKey = await this.encryptWithRSA(aesKey, myPublicKey);
    }

    console.log('🔐 [ENCRYPT] Encryption completed');

    return {
      ciphertext,
      encryptedKey,
      encryptedSenderKey,
      iv,
      hash,
      timestamp: Date.now(),
    };
  }

  async decryptMessagePayload(
    ciphertext: string,
    encryptedKey: string,
    iv: string,
    hash: string,
    myPrivateKey: string
  ): Promise<{ plaintext: string; isValid: boolean }> {
    try {
      // 1. Decrypt AES key via RSA private key
      const userKey = await this.decryptWithRSA(encryptedKey, myPrivateKey);

      // 2. Decrypt message via AES
      const plaintext = await this.decryptAES(ciphertext, userKey, iv);

      // 3. Verify hash
      const computedHash = await this.hashMessage(plaintext);
      const isValid = computedHash === hash;

      return { plaintext, isValid };
    } catch (error) {
      throw error;
    }
  }

  // ═══════════════════════ SESSION ════════════════════════════════════════

  setSessionKey(key: string): void { this.sessionKey = key; }
  getSessionKey(): string | null    { return this.sessionKey; }
  clearSessionKey(): void           { this.sessionKey = null; }
  clearMemory(..._args: any[]): void {}
}

export default new EncryptionService();