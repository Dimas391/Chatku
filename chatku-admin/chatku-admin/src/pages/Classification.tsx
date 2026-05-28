import React, { useState, useEffect } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import {
  ResponsiveContainer, PieChart, Pie, Cell, Tooltip, Legend,
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  LineChart, Line, AreaChart, Area,
} from 'recharts';
import {
  Brain, ShieldAlert, CheckCircle2, AlertTriangle,
  Zap, RefreshCw, Send, ChevronDown,
} from 'lucide-react';
import dashboardService, { ClassificationLog } from '@/services/dashboardService';
import '@/components/classification/classification.css';

/* ─────────────────────────── MOCK DATA ────────────────────────────── */

const classColors: Record<string, string> = {
  'Tidak Berisiko': 'var(--chart-3)', // hijau
  'Berisiko':       '#EF4444',        // merah
};

const distributionData = [
  { name: 'Tidak Berisiko', value: 4820, pct: 56 },
  { name: 'Berisiko',       value: 3760, pct: 44 },
];

const weeklyTrend = ['Sen','Sel','Rab','Kam','Jum','Sab','Min'].map((day, i) => ({
  day,
  'Tidak Berisiko': 200 + Math.round(Math.sin(i) * 50 + 180),
  'Berisiko':       120 + Math.round(Math.cos(i * 1.2) * 50 + 100),
}));

const confusionData = [
  { label: 'Tidak Berisiko → Tidak Berisiko', v: 95, fill: classColors['Tidak Berisiko'] },
  { label: 'Berisiko → Berisiko',             v: 88, fill: classColors['Berisiko'] },
];

const recentLogs = [
  { id: 1, user: 'Aisyah',   preview: 'Selamat pagi, gimana kabarmu?',           label: 'Tidak Berisiko', conf: 97, time: '2 mnt lalu' },
  { id: 2, user: 'Rendy',    preview: 'GRATIS! Klik link ini sekarang!!!',        label: 'Berisiko',       conf: 93, time: '5 mnt lalu' },
  { id: 3, user: 'Unknown',  preview: 'Saya akan melakukan sesuatu padamu...',    label: 'Berisiko',       conf: 88, time: '12 mnt lalu' },
  { id: 4, user: 'Budi',     preview: 'Vaksin itu ternyata mengandung chip!',     label: 'Berisiko',       conf: 85, time: '18 mnt lalu' },
  { id: 5, user: 'Sari',     preview: 'Kamu tidak pantas hidup di sini!',         label: 'Berisiko',       conf: 82, time: '25 mnt lalu' },
  { id: 6, user: 'Dimas',    preview: 'Ada jadwal meeting besok jam 10 pagi?',    label: 'Tidak Berisiko', conf: 99, time: '31 mnt lalu' },
  { id: 7, user: 'Kevin',    preview: 'Menangkan hadiah 100 juta sekarang!',      label: 'Berisiko',       conf: 91, time: '40 mnt lalu' },
];

const modelMetrics = [
  { metric: 'Akurasi',   value: '93.0%', color: 'var(--chart-3)' },
  { metric: 'Presisi',   value: '59.4%', color: 'var(--brand)' },
  { metric: 'Recall',    value: '67.1%', color: 'var(--chart-2)' },
  { metric: 'F1-Score',  value: '63.0%', color: '#A855F7' },
];

const monthlyAccuracy = [
  { bulan: 'Des', akurasi: 89 },
  { bulan: 'Jan', akurasi: 90 },
  { bulan: 'Feb', akurasi: 91 },
  { bulan: 'Mar', akurasi: 92 },
  { bulan: 'Apr', akurasi: 92 },
  { bulan: 'Mei', akurasi: 93 },
];

/* ─────────────────────────── SUBCOMPONENTS ───────────────────────── */

const LabelBadge = ({ label }: { label: string }) => {
  const colorMap: Record<string, string> = {
    'Tidak Berisiko': '#22C55E',
    'Berisiko':       '#EF4444',
  };
  const bg = colorMap[label] ?? 'var(--text-muted)';
  return (
    <span className="cls-badge" style={{ background: `${bg}22`, color: bg, borderColor: `${bg}44` }}>
      {label}
    </span>
  );
};

const ConfBar = ({ label, v, fill }: { label: string; v: number; fill: string }) => (
  <div className="conf-row">
    <span className="conf-label">{label}</span>
    <div className="conf-track">
      <div className="conf-fill" style={{ width: `${v}%`, background: fill }} />
    </div>
    <strong className="conf-val">{v}%</strong>
  </div>
);

/* ─────────────────────────── LIVE TEST PANEL ─────────────────────── */

type ClassResult = {
  label: string;
  confidence: number;
  scores: { label: string; score: number }[];
};

const TestPanel: React.FC = () => {
  const [text, setText] = useState('');
  const [result, setResult] = useState<ClassResult | null>(null);
  const [loading, setLoading] = useState(false);

  const handleClassify = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      const res = await dashboardService.classifyTest(text);
      setResult(res);
    } catch (error) {
      console.error('Classification test failed:', error);
      alert('Gagal melakukan uji klasifikasi. Pastikan model AI telah dimuat di server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="test-panel">
      <textarea
        className="test-textarea"
        placeholder="Ketik pesan yang ingin diklasifikasikan…"
        value={text}
        onChange={e => setText(e.target.value)}
        rows={4}
      />
      <div className="test-actions">
        <span className="test-charcount">{text.length} karakter</span>
        <Button onClick={handleClassify} disabled={loading || !text.trim()}>
          {loading ? <RefreshCw size={14} className="spin" /> : <Send size={14} />}
          {loading ? 'Menganalisis…' : 'Klasifikasikan'}
        </Button>
      </div>

      {result && (
        <div className="test-result">
          <div className="test-result-header">
            <span className="test-result-label">Hasil:</span>
            <LabelBadge label={result.label} />
            <span className="test-conf">{result.confidence}% confidence</span>
          </div>
          <div className="test-scores">
            {result.scores.sort((a, b) => b.score - a.score).map(s => (
              <ConfBar key={s.label} label={s.label} v={s.score} fill={classColors[s.label]} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────── MAIN PAGE ──────────────────────────── */

export const Classification: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'pie' | 'bar'>('pie');
  const [distData, setDistData] = useState(distributionData);
  const [logs, setLogs] = useState<ClassificationLog[]>(recentLogs as any);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summary = await dashboardService.getClassificationSummary();
        const totalCount = summary.normal + summary.berisiko;
        if (totalCount > 0) {
          setDistData([
            { name: 'Tidak Berisiko', value: summary.normal, pct: Math.round((summary.normal / totalCount) * 100) },
            { name: 'Berisiko',       value: summary.berisiko, pct: Math.round((summary.berisiko / totalCount) * 100) },
          ]);
        }
        
        const logsData = await dashboardService.getClassificationLogs();
        if (logsData && logsData.length > 0) {
          setLogs(logsData);
        }
      } catch (error) {
        console.error('Error fetching classification data:', error);
      }
    };
    
    fetchData();
    // Refresh setiap 30 detik agar realtime
    const interval = setInterval(fetchData, 30000);
    return () => clearInterval(interval);
  }, []);

  const total = distData.reduce((a, b) => a + b.value, 0);

  return (
    <div className="cls-page">
      {/* ── Header ── */}
      <div className="cls-header">
        <div className="cls-header-left">
          <div className="cls-icon"><Brain size={22} /></div>
          <div>
            <h1 className="cls-title">Klasifikasi Pesan</h1>
            <p className="cls-subtitle">Analisis konten berbasis model Naive Bayes · 2 kelas</p>
          </div>
        </div>
        <div className="cls-header-right">
          {modelMetrics.map(m => (
            <div key={m.metric} className="cls-metric-pill">
              <span>{m.metric}</span>
              <strong style={{ color: m.color }}>{m.value}</strong>
            </div>
          ))}
        </div>
      </div>

      {/* ── Stat Row ── */}
      <div className="cls-stats-row">
        {distData.map(d => (
          <div key={d.name} className="cls-stat">
            <div className="cls-stat-dot" style={{ background: classColors[d.name] }} />
            <div className="cls-stat-body">
              <span className="cls-stat-name">{d.name}</span>
              <strong className="cls-stat-val">{d.value.toLocaleString()}</strong>
              <span className="cls-stat-pct">{d.pct}%</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Row 1: Distribution + Weekly Trend ── */}
      <div className="cls-grid">
        {/* Distribution Chart */}
        <Card
          title="Distribusi Kelas"
          subtitle={`Total ${total.toLocaleString()} pesan teranalisis`}
          className="cls-col-5"
          action={
            <div className="tab-toggle">
              <button className={activeTab === 'pie' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('pie')}>Pie</button>
              <button className={activeTab === 'bar' ? 'tab-btn active' : 'tab-btn'} onClick={() => setActiveTab('bar')}>Bar</button>
            </div>
          }
        >
          {activeTab === 'pie' ? (
            <>
              <ResponsiveContainer width="100%" height={230}>
                <PieChart>
                  <Pie
                    data={distData}
                    dataKey="value"
                    innerRadius={60}
                    outerRadius={95}
                    paddingAngle={4}
                  >
                    {distData.map(d => (
                      <Cell key={d.name} fill={classColors[d.name]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
                    formatter={(v: number) => [v.toLocaleString(), 'Pesan']}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="legend-list">
                {distData.map(d => (
                  <div key={d.name} className="legend-row">
                    <span className="dot" style={{ background: classColors[d.name] }} />
                    {d.name}
                    <strong>{d.value.toLocaleString()}</strong>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <ResponsiveContainer width="100%" height={290}>
              <BarChart data={distData} layout="vertical">
                <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" horizontal={false} />
                <XAxis type="number" stroke="var(--text-muted)" fontSize={11} />
                <YAxis type="category" dataKey="name" stroke="var(--text-muted)" fontSize={11} width={90} />
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
                <Bar dataKey="value" radius={[0, 6, 6, 0]}>
                  {distData.map(d => <Cell key={d.name} fill={classColors[d.name]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          )}
        </Card>

        {/* Weekly Trend */}
        <Card title="Tren Mingguan" subtitle="Jumlah pesan per kelas (7 hari)" className="cls-col-7">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={weeklyTrend}>
              <defs>
                {Object.entries(classColors).map(([name, color]) => (
                  <linearGradient key={name} id={`g-${name.replace(' ', '-')}`} x1="0" x2="0" y1="0" y2="1">
                    <stop offset="0%" stopColor={color} stopOpacity={0.5} />
                    <stop offset="100%" stopColor={color} stopOpacity={0} />
                  </linearGradient>
                ))}
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11} />
              <YAxis stroke="var(--text-muted)" fontSize={11} />
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
              <Legend wrapperStyle={{ fontSize: 12 }} />
              {Object.keys(classColors).map(name => (
                <Area
                  key={name}
                  type="monotone"
                  dataKey={name}
                  stroke={classColors[name]}
                  fill={`url(#g-${name.replace(' ', '-')})`}
                  strokeWidth={2}
                />
              ))}
            </AreaChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* ── Row 2: Model Accuracy + Precision per class + Live Test ── */}
      <div className="cls-grid">
        {/* Accuracy Trend */}
        <Card title="Akurasi Model" subtitle="6 bulan terakhir (Naive Bayes)" className="cls-col-4">
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={monthlyAccuracy}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false} />
              <XAxis dataKey="bulan" stroke="var(--text-muted)" fontSize={11} />
              <YAxis domain={[80, 100]} stroke="var(--text-muted)" fontSize={11} unit="%" />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={(v: number) => [`${v}%`, 'Akurasi']}
              />
              <Line
                type="monotone"
                dataKey="akurasi"
                stroke="var(--chart-3)"
                strokeWidth={2.5}
                dot={{ fill: 'var(--chart-3)', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="model-metrics-grid">
            {modelMetrics.map(m => (
              <div key={m.metric} className="model-metric-item">
                <span className="model-metric-label">{m.metric}</span>
                <strong className="model-metric-val" style={{ color: m.color }}>{m.value}</strong>
              </div>
            ))}
          </div>
        </Card>

        {/* Per-class accuracy */}
        <Card title="Presisi Per Kelas" subtitle="Confusion matrix diagonal" className="cls-col-4">
          <div className="conf-list">
            {confusionData.map(c => (
              <ConfBar key={c.label} label={c.label} v={c.v} fill={c.fill} />
            ))}
          </div>
        </Card>

        {/* Live Test Panel */}
        <Card
          title="Uji Klasifikasi"
          subtitle="Test pesan secara langsung"
          className="cls-col-4"
          action={<Badge tone="brand"><Zap size={10} /> Live</Badge>}
        >
          <TestPanel />
        </Card>
      </div>

      {/* ── Row 3: Recent Classification Log ── */}
      <Card title="Log Klasifikasi Terbaru" subtitle="Pesan yang baru dianalisis oleh sistem">
        <div className="cls-table-wrap">
          <table className="cls-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Pengguna</th>
                <th>Pratinjau Pesan</th>
                <th>Label</th>
                <th>Confidence</th>
                <th>Waktu</th>
              </tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id}>
                  <td className="td-id">
                    <span title={String(log.id)}>{String(log.id).slice(0, 4)}</span>
                  </td>
                  <td>
                    <div className="td-user">
                      <div className="avatar" style={{ width: 30, height: 30, fontSize: 11 }}>
                        {log.user.slice(0, 2).toUpperCase()}
                      </div>
                      {log.user}
                    </div>
                  </td>
                  <td className="td-preview">{log.preview}</td>
                  <td><LabelBadge label={log.label} /></td>
                  <td>
                    <div className="td-conf-wrap">
                      <div className="td-conf-bar">
                        <div
                          className="td-conf-fill"
                          style={{ width: `${log.conf}%`, background: classColors[log.label] }}
                        />
                      </div>
                      <span>{log.conf}%</span>
                    </div>
                  </td>
                  <td className="td-time">{log.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};
