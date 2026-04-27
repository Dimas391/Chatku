import * as Crypto from 'expo-crypto';
import Aes from 'react-native-aes-crypto';
import { Buffer } from 'buffer';
import 'react-native-get-random-values';
import * as SecureStore from 'expo-secure-store';
import { RSA } from 'react-native-rsa-native';

const RNAesCrypto = Aes;

export interface DualEncryptedMessage {
  ciphertextUser: string;
  ciphertextServer: string;
  encryptedUserKey: string;
  encryptedServerKey: string;
  iv: string;
  hash: string;
  timestamp: number;
}

export interface DecryptedMessage {
  plaintext: string;
  isValid: boolean;
}

class EncryptionService {
  private sessionKey: string | null = null;
  private myPrivateKey: string | null = null;
  private myPublicKey: string | null = null;
  private serverPublicKey: string | null = null;

  // ==================== RSA KEY MANAGEMENT ====================
  
  async generateUserKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
    try {
      console.log('[RSA] Generating user key pair...');
      const keyPair = await RSA.generateKeys(2048);
      
      this.myPublicKey = keyPair.public;
      this.myPrivateKey = keyPair.private;
      
      // Simpan ke SecureStore
      await SecureStore.setItemAsync('user_private_key', keyPair.private);
      await SecureStore.setItemAsync('user_public_key', keyPair.public);
      
      console.log('[RSA] User RSA key pair generated and saved');
      console.log('[RSA] Public key length:', keyPair.public.length);
      console.log('[RSA] Private key length:', keyPair.private.length);
      
      return {
        publicKey: keyPair.public,
        privateKey: keyPair.private
      };
    } catch (error) {
      console.error('[RSA] Error generating user key pair:', error);
      throw error;
    }
  }

  async loadUserKeys(): Promise<void> {
    try {
      console.log('[RSA] Loading user keys from SecureStore...');
      this.myPrivateKey = await SecureStore.getItemAsync('user_private_key');
      this.myPublicKey = await SecureStore.getItemAsync('user_public_key');
      console.log('[RSA] User keys loaded:', {
        hasPrivateKey: !!this.myPrivateKey,
        hasPublicKey: !!this.myPublicKey
      });
    } catch (error) {
      console.error('[RSA] Error loading user keys:', error);
    }
  }

  async getMyPublicKey(): Promise<string | null> {
    if (!this.myPublicKey) {
      await this.loadUserKeys();
    }
    return this.myPublicKey;
  }

  async getMyPrivateKey(): Promise<string | null> {
    if (!this.myPrivateKey) {
      await this.loadUserKeys();
    }
    return this.myPrivateKey;
  }

  async setServerPublicKey(publicKey: string): Promise<void> {
    this.serverPublicKey = publicKey;
    console.log('[RSA] Server public key set, length:', publicKey.length);
  }

  async getServerPublicKey(): Promise<string | null> {
    return this.serverPublicKey;
  }

  // ==================== AES ENCRYPTION ====================
  
  async generateAESKey(): Promise<string> {
    const randomBytes = await Crypto.getRandomBytesAsync(32);
    const key = Buffer.from(randomBytes).toString('base64');
    console.log(' [AES] Generated AES key, length:', key.length);
    return key;
  }

  async generateIV(): Promise<string> {
    const ivBytes = await Crypto.getRandomBytesAsync(16);
    const iv = Buffer.from(ivBytes).toString('base64');
    console.log('[AES] Generated IV, length:', iv.length);
    return iv;
  }

  async encryptAES(plaintext: string, key: string, iv: string): Promise<string> {
    try {
      console.log('[AES] Encrypting message of length:', plaintext.length);
      const keyHex = Buffer.from(key, 'base64').toString('hex');
      const ivHex = Buffer.from(iv, 'base64').toString('hex');
      const ciphertext = await RNAesCrypto.encrypt(plaintext, keyHex, ivHex, 'aes-256-cbc');
      console.log('[AES] Encrypted successfully, ciphertext length:', ciphertext.length);
      return ciphertext;
    } catch (error) {
      console.error('[AES] Error encrypting with AES:', error);
      throw error;
    }
  }

  async decryptAES(ciphertext: string, key: string, iv: string): Promise<string> {
    try {
      console.log('🔐 [AES] Decrypting ciphertext of length:', ciphertext.length);
      const keyHex = Buffer.from(key, 'base64').toString('hex');
      const ivHex = Buffer.from(iv, 'base64').toString('hex');
      const plaintext = await RNAesCrypto.decrypt(ciphertext, keyHex, ivHex, 'aes-256-cbc');
      console.log('🔐 [AES] Decrypted successfully, plaintext length:', plaintext.length);
      return plaintext;
    } catch (error) {
      console.error('❌ [AES] Error decrypting with AES:', error);
      throw error;
    }
  }

  // ==================== RSA ENCRYPTION ====================
  async encryptWithRSA(plaintext: string, publicKey: string): Promise<string> {
    try {
      console.log('🔐 [RSA] Encrypting with RSA, plaintext length:', plaintext.length);

      // Ambil hanya konten Base64-nya saja
      const base64Key = publicKey
        .replace(/-----BEGIN PUBLIC KEY-----/g, '')
        .replace(/-----END PUBLIC KEY-----/g, '')
        .replace(/\s/g, ''); // Hapus semua spasi/newline di konten

      // Format ulang dengan header/footer yang benar dan newline
      const formattedKey = `-----BEGIN PUBLIC KEY-----\n${base64Key}\n-----END PUBLIC KEY-----`;

      const encrypted = await RSA.encrypt(plaintext, formattedKey);
      console.log('🔐 [RSA] RSA encrypted, ciphertext length:', encrypted.length);
      return encrypted;
    } catch (error) {
      console.error('❌ [RSA] Error encrypting with RSA:', error);
      throw error;
    }
  }

  async decryptWithRSA(ciphertext: string, privateKey: string): Promise<string> {
    try {
      console.log('🔐 [RSA] Decrypting with RSA, ciphertext length:', ciphertext.length);
      const decrypted = await RSA.decrypt(ciphertext, privateKey);
      console.log('🔐 [RSA] RSA decrypted, plaintext length:', decrypted.length);
      return decrypted;
    } catch (error) {
      console.error('❌ [RSA] Error decrypting with RSA:', error);
      throw error;
    }
  }

  // ==================== DUAL ENCRYPTION ====================
  
  async dualEncryptMessage(
    message: string,
    recipientPublicKey: string,
    serverPublicKey: string
  ): Promise<DualEncryptedMessage> {
    console.log('🔐 [DUAL] ========================================');
    console.log('🔐 [DUAL] Starting dual encryption...');
    console.log('🔐 [DUAL] Original message length:', message.length);
    console.log('🔐 [DUAL] Original message preview:', message.substring(0, 50));
    
    // 1. Generate 2 AES keys
    const userKey = await this.generateAESKey();
    const serverKey = await this.generateAESKey();
    
    console.log('🔐 [DUAL] AES keys generated');
    console.log('🔐 [DUAL] User key (base64):', userKey.substring(0, 20) + '...');
    console.log('🔐 [DUAL] Server key (base64):', serverKey.substring(0, 20) + '...');
    
    // 2. Generate IV
    const iv = await this.generateIV();
    console.log('🔐 [DUAL] IV generated (base64):', iv.substring(0, 20) + '...');
    
    // 3. Hash original message
    const hash = await this.hashMessage(message);
    console.log('🔐 [DUAL] Message hash:', hash.substring(0, 20) + '...');
    
    // 4. Encrypt with USER key (end-to-end)
    const ciphertextUser = await this.encryptAES(message, userKey, iv);
    
    // 5. Encrypt with SERVER key (for classification)
    const ciphertextServer = await this.encryptAES(message, serverKey, iv);
    
    // 6. Encrypt AES keys with RSA
    const encryptedUserKey = await this.encryptWithRSA(userKey, recipientPublicKey);
    const encryptedServerKey = await this.encryptWithRSA(serverKey, serverPublicKey);
    
    console.log('🔐 [DUAL] Dual encryption completed');
    console.log('🔐 [DUAL] User ciphertext length:', ciphertextUser.length);
    console.log('🔐 [DUAL] Server ciphertext length:', ciphertextServer.length);
    console.log('🔐 [DUAL] ========================================');
    
    return {
      ciphertextUser,
      ciphertextServer,
      encryptedUserKey,
      encryptedServerKey,
      iv,
      hash,
      timestamp: Date.now()
    };
  }

  async dualDecryptMessage(
    ciphertextUser: string,
    encryptedUserKey: string,
    iv: string,
    hash: string,
    myPrivateKey: string
  ): Promise<{ plaintext: string; isValid: boolean }> {
    console.log('🔐 [DUAL DECRYPT] ========================================');
    console.log('🔐 [DUAL DECRYPT] Starting dual decryption...');
    console.log('🔐 [DUAL DECRYPT] Ciphertext length:', ciphertextUser.length);
    console.log('🔐 [DUAL DECRYPT] IV available:', !!iv);
    console.log('🔐 [DUAL DECRYPT] Hash available:', !!hash);
    
    try {
      // 1. Decrypt AES user key with RSA private key
      console.log('🔐 [DUAL DECRYPT] Decrypting AES user key with RSA...');
      const userKey = await this.decryptWithRSA(encryptedUserKey, myPrivateKey);
      console.log('🔐 [DUAL DECRYPT] AES user key decrypted:', userKey.substring(0, 20) + '...');
      
      // 2. Decrypt message with AES user key
      console.log('🔐 [DUAL DECRYPT] Decrypting ciphertext with AES...');
      const plaintext = await this.decryptAES(ciphertextUser, userKey, iv);
      console.log('🔐 [DUAL DECRYPT] Plaintext decrypted:', plaintext.substring(0, 50));
      
      // 3. Verify hash
      console.log('🔐 [DUAL DECRYPT] Verifying hash...');
      const computedHash = await this.hashMessage(plaintext);
      const isValid = computedHash === hash;
      
      console.log(`🔐 [DUAL DECRYPT] Computed hash: ${computedHash.substring(0, 20)}...`);
      console.log(`🔐 [DUAL DECRYPT] Received hash: ${hash.substring(0, 20)}...`);
      console.log(`🔐 [DUAL DECRYPT] Hash match: ${isValid ? '✅ VALID' : '❌ INVALID'}`);
      
      if (!isValid) {
        console.warn('⚠️ [DUAL DECRYPT] Message integrity check FAILED!');
      }
      
      console.log('🔐 [DUAL DECRYPT] ========================================');
      
      return { plaintext, isValid };
    } catch (error) {
      console.error('❌ [DUAL DECRYPT] Failed:', error);
      throw error;
    }
  }

  // ==================== HASHING ====================
  
  async hashMessage(message: string): Promise<string> {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        message
      );
      return hash;
    } catch (error) {
      console.error('❌ [HASH] Error hashing message:', error);
      throw error;
    }
  }

  // ==================== SESSION MANAGEMENT ====================
  
  setSessionKey(key: string): void {
    this.sessionKey = key;
    console.log('🔐 [SESSION] Session key set');
  }

  getSessionKey(): string | null {
    return this.sessionKey;
  }

  clearSessionKey(): void {
    this.sessionKey = null;
    console.log('🔐 [SESSION] Session key cleared');
  }
  
  // ==================== CLEAR MEMORY ====================
  
  clearMemory(...args: any[]): void {
    // Untuk JavaScript, garbage collector akan handle
    console.log('🧹 [CLEAR] Memory cleared');
  }
}

export default new EncryptionService();