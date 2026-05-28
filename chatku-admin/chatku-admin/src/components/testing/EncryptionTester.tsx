import { useState } from 'react';
import { Card, Button, Badge } from '@/components/ui';

const enc = new TextEncoder();
const dec = new TextDecoder();

const buf2b64 = (b: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(b)));

export const EncryptionTester = () => {
  const [plain, setPlain] = useState('Halo, ini pesan rahasia ChatKu!');
  const [pass, setPass] = useState('chatku-demo-key');
  const [cipher, setCipher] = useState('');
  const [decrypted, setDecrypted] = useState('');
  const [busy, setBusy] = useState(false);

  const deriveKey = async (p: string) => {
    const base = await crypto.subtle.importKey('raw', enc.encode(p), 'PBKDF2', false, ['deriveKey']);
    return crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt: enc.encode('chatku-salt'), iterations: 100_000, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['encrypt', 'decrypt'],
    );
  };

  const encrypt = async () => {
    setBusy(true);
    try {
      const key = await deriveKey(pass);
      const iv = crypto.getRandomValues(new Uint8Array(12));
      const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(plain));
      const payload = buf2b64(iv.buffer) + ':' + buf2b64(ct);
      setCipher(payload);
      setDecrypted('');
    } finally { setBusy(false); }
  };

  const decrypt = async () => {
    setBusy(true);
    try {
      const [ivB64, ctB64] = cipher.split(':');
      const iv = Uint8Array.from(atob(ivB64), c => c.charCodeAt(0));
      const ct = Uint8Array.from(atob(ctB64), c => c.charCodeAt(0));
      const key = await deriveKey(pass);
      const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, ct);
      setDecrypted(dec.decode(pt));
    } catch (e: any) {
      setDecrypted('❌ Gagal dekripsi: ' + e.message);
    } finally { setBusy(false); }
  };

  return (
    <Card
      title="Simulasi Enkripsi End-to-End"
      subtitle="AES-GCM 256-bit + PBKDF2 (sama seperti yang dipakai aplikasi)"
      action={<Badge tone="success">Web Crypto API</Badge>}
    >
      <div className="field-grid">
        <div className="field">
          <label>Pesan Asli</label>
          <textarea value={plain} onChange={e => setPlain(e.target.value)} />
        </div>
        <div className="field">
          <label>Kunci / Passphrase</label>
          <input value={pass} onChange={e => setPass(e.target.value)} />
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <Button onClick={encrypt} disabled={busy}>Enkripsi</Button>
        <Button variant="outline" onClick={decrypt} disabled={busy || !cipher}>Dekripsi</Button>
      </div>

      <div className="field" style={{ marginBottom: 12 }}>
        <label>Ciphertext (iv:base64)</label>
        <textarea value={cipher} readOnly />
      </div>
      <div className="field">
        <label>Hasil Dekripsi</label>
        <textarea value={decrypted} readOnly />
      </div>
    </Card>
  );
};
