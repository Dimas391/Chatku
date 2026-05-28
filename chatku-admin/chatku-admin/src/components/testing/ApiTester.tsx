import { useState } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { API_CONFIG } from '@/config/api';

export const ApiTester = () => {
  const [method, setMethod] = useState('GET');
  const [url, setUrl] = useState(`${API_CONFIG.BASE_URL}/dashboard/stats`);
  const [body, setBody] = useState('{\n  "text": "contoh uji API"\n}');
  const [loading, setLoading] = useState(false);
  const [output, setOutput] = useState('// Hasil response akan tampil di sini\n');

  const send = async () => {
    setLoading(true);
    setOutput('⏳ Mengirim ' + method + ' ' + url + ' ...\n');
    const t0 = performance.now();
    try {
      const opts: RequestInit = { method, headers: {} };
      
      // Auto inject token if available
      const session = localStorage.getItem('admin_session');
      if (session) {
        try {
          const token = JSON.parse(session).token;
          if (token) {
            (opts.headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
          }
        } catch (e) {}
      }

      if (method !== 'GET' && method !== 'DELETE') {
        (opts.headers as Record<string, string>)['Content-Type'] = 'application/json';
        opts.body = body;
      }
      const res = await fetch(url, opts);
      const text = await res.text();
      const ms = Math.round(performance.now() - t0);
      let pretty = text;
      try { pretty = JSON.stringify(JSON.parse(text), null, 2); } catch {}
      setOutput(`✅ ${res.status} ${res.statusText}  •  ${ms}ms\n\n${pretty}`);
    } catch (e: any) {
      setOutput('❌ ' + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card
      title="API Tester (Live Backend)"
      subtitle="Uji endpoint backend ChatKu secara langsung (Token Admin disisipkan otomatis jika login)"
      action={<Badge tone="success">Online</Badge>}
    >
      <div style={{ marginBottom: 12, display: 'flex', gap: 10 }}>
        <Button onClick={send} disabled={loading}>{loading ? 'Mengirim...' : 'Kirim Request API'}</Button>
        <Button variant="outline" onClick={() => setOutput('// Console dibersihkan\n')}>Clear Log</Button>
      </div>
      <div className="field-grid">
        <div className="field">
          <label>Method</label>
          <select value={method} onChange={e => setMethod(e.target.value)}>
            {['GET','POST','PUT','PATCH','DELETE'].map(m => <option key={m}>{m}</option>)}
          </select>
        </div>
        <div className="field">
          <label>Endpoint URL</label>
          <input value={url} onChange={e => setUrl(e.target.value)} />
        </div>
      </div>
      <div className="field" style={{ marginBottom: 12 }}>
        <label>Body (JSON)</label>
        <textarea value={body} onChange={e => setBody(e.target.value)} />
      </div>
      <div className="console">{output}</div>
    </Card>
  );
};
