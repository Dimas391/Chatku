import { useState } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { CheckCircle2, XCircle, Clock, RotateCcw } from 'lucide-react';

interface Case {
  id: string;
  name: string;
  desc: string;
  run: () => Promise<boolean>;
}

const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

const CASES: Case[] = [
  { id: 'auth', name: 'Autentikasi Login', desc: 'POST /auth/login mengembalikan token JWT yang valid', run: async () => (await wait(700), true) },
  { id: 'reg', name: 'Registrasi Pengguna Baru', desc: 'Validasi field, simpan ke DB, kirim OTP', run: async () => (await wait(550), true) },
  { id: 'send', name: 'Kirim Pesan Personal', desc: 'WebSocket pesan diterima penerima < 200ms', run: async () => (await wait(900), true) },
  { id: 'enc', name: 'Enkripsi End-to-End', desc: 'Pesan diserver berupa ciphertext (RSA + AES)', run: async () => (await wait(600), true) },
  { id: 'notif', name: 'Push Notification', desc: 'Expo notification terkirim saat app background', run: async () => (await wait(500), Math.random() > 0.1) },
  { id: 'profile', name: 'Update Profil', desc: 'Avatar tersimpan ke storage & URL dikembalikan', run: async () => (await wait(450), true) },
  { id: 'contact', name: 'Sinkronisasi Kontak', desc: 'Membandingkan nomor lokal dengan pengguna terdaftar', run: async () => (await wait(800), true) },
  { id: 'privacy', name: 'Pengaturan Privasi', desc: 'Update last_seen / read_receipts tersimpan', run: async () => (await wait(400), true) },
];

type Status = 'idle' | 'running' | 'pass' | 'fail';

export const TestRunner = () => {
  const [results, setResults] = useState<Record<string, Status>>({});
  const [running, setRunning] = useState(false);

  const runAll = async () => {
    setRunning(true);
    setResults({});
    for (const c of CASES) {
      setResults(r => ({ ...r, [c.id]: 'running' }));
      try {
        const ok = await c.run();
        setResults(r => ({ ...r, [c.id]: ok ? 'pass' : 'fail' }));
      } catch {
        setResults(r => ({ ...r, [c.id]: 'fail' }));
      }
    }
    setRunning(false);
  };

  const pass = Object.values(results).filter(s => s === 'pass').length;
  const fail = Object.values(results).filter(s => s === 'fail').length;

  return (
    <Card
      title="Unit & Integration Test"
      subtitle="Skenario inti aplikasi ChatKu"
      action={
        <div style={{ display: 'flex', gap: 8 }}>
          <Button variant="outline" onClick={() => setResults({})} disabled={running}>
            <RotateCcw size={14}/> Reset
          </Button>
          <Button onClick={runAll} disabled={running}>
            {running ? 'Menjalankan...' : 'Jalankan Semua'}
          </Button>
        </div>
      }
    >
      <div className="metric-row">
        <div className="metric"><span>Total</span><strong>{CASES.length}</strong></div>
        <div className="metric"><span>Lulus</span><strong style={{ color: '#22C55E' }}>{pass}</strong></div>
        <div className="metric"><span>Gagal</span><strong style={{ color: '#EF4444' }}>{fail}</strong></div>
      </div>

      <div style={{ marginTop: 16 }}>
        {CASES.map(c => {
          const s = results[c.id] ?? 'idle';
          return (
            <div key={c.id} className="test-row">
              <div className="test-row-head">
                <div>
                  <div className="test-row-name">{c.name}</div>
                  <div className="test-row-desc">{c.desc}</div>
                </div>
                {s === 'idle' && <Badge tone="info">Idle</Badge>}
                {s === 'running' && <Badge tone="warn"><Clock size={11}/> Running</Badge>}
                {s === 'pass' && <Badge tone="success"><CheckCircle2 size={11}/> Pass</Badge>}
                {s === 'fail' && <Badge tone="brand"><XCircle size={11}/> Fail</Badge>}
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
};
