import React, { useState, useEffect } from 'react';
import { Card, Badge } from '@/components/ui';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid,
  RadialBarChart, RadialBar, BarChart, Bar, PieChart, Pie, Cell, Legend,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
} from 'recharts';
import { ArrowUpRight, ArrowDownRight, Users, MessageCircle, Activity, Shield, Brain } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import dashboardService, { 
  DashboardStats, MessageTrend, ActivityData, 
  PlatformRank, RecentActivity, ClassificationSummary, SecurityStatus, EncryptionStats, FeatureStats 
} from '@/services/dashboardService';
import '@/components/dashboard/dashboard.css';

/* ---------- Loading Skeleton ---------- */
const LoadingSkeleton = () => (
  <div className="dash-loading">
    <div className="skeleton stats-skeleton"></div>
    <div className="skeleton chart-skeleton"></div>
  </div>
);

/* ---------- UI Components ---------- */
const Stat = ({ label, value, delta, up, icon: Icon, loading }: any) => (
  <div className="stat">
    <div className="stat-icon"><Icon size={18} /></div>
    <div className="stat-body">
      <span className="stat-label">{label}</span>
      {loading ? (
        <div className="skeleton-text"></div>
      ) : (
        <>
          <strong className="stat-value">{value?.toLocaleString() || '0'}</strong>
          <span className={`stat-delta ${up ? 'up' : 'down'}`}>
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />} {delta}
          </span>
        </>
      )}
    </div>
  </div>
);

const Ring: React.FC<{ pct: number; color: string; label: string; loading?: boolean }> = ({ pct, color, label, loading }) => (
  <div className="ring-wrap">
    {loading ? (
      <div className="skeleton-ring"></div>
    ) : (
      <>
        <ResponsiveContainer width="100%" height={150}>
          <RadialBarChart innerRadius="70%" outerRadius="100%" data={[{ v: pct, fill: color }]} startAngle={90} endAngle={-270}>
            <RadialBar background={{ fill: 'var(--surface-2)' }} dataKey="v" cornerRadius={20} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="ring-center">
          <strong style={{ color }}>{pct}%</strong>
          <span>{label}</span>
        </div>
      </>
    )}
  </div>
);

export const Dashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [trendData, setTrendData] = useState<MessageTrend[]>([]);
  const [sampling, setSampling] = useState<ActivityData[]>([]);
  const [ranks, setRanks] = useState<PlatformRank[]>([]);
  const [activities, setActivities] = useState<RecentActivity[]>([]);
  const [clsDist, setClsDist] = useState<ClassificationSummary | null>(null);
  const [security, setSecurity] = useState<SecurityStatus | null>(null);
  const [encryption, setEncryption] = useState<EncryptionStats | null>(null);
  const [featureStats, setFeatureStats] = useState<FeatureStats | null>(null);
  const [modelMeta, setModelMeta] = useState<any>(null);

  const catalog = [
    { name: 'Total Pesan',    value: stats?.total_messages ?? 0, fill: 'var(--brand)' },
    { name: 'Total Pengguna', value: stats?.total_users ?? 0, fill: 'var(--chart-2)' },
    { name: 'Sesi Online',    value: stats?.active_sessions ?? 0, fill: 'var(--chart-3)' },
  ];

  const status = [
    { name: 'Online',  value: featureStats?.online_pct  ?? 0,  fill: 'var(--chart-3)' },
    { name: 'Idle',    value: featureStats?.idle_pct    ?? 0,  fill: 'var(--chart-4)' },
    { name: 'Offline', value: featureStats?.offline_pct ?? 100, fill: 'var(--chart-2)' },
  ];

  const radar = featureStats?.feature_usage ?? [
    { area: 'Chat',   a: 1 }, { area: 'File',   a: 1 },
    { area: 'Kontak', a: 1 }, { area: 'Login',  a: 1 },
  ];


  const circles = [
    { label: 'Pesan Terkirim',  pct: featureStats?.delivery_stats.sent_pct    ?? 0, color: 'var(--chart-2)' },
    { label: 'Pesan Gagal',     pct: featureStats?.delivery_stats.failed_pct  ?? 0, color: 'var(--brand)'   },
    { label: 'Sedang Dikirim',  pct: featureStats?.delivery_stats.pending_pct ?? 0, color: 'var(--chart-4)' },
  ];

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [
          statsData,
          trendRaw,
          samplingData,
          ranksData,
          activitiesData,
          clsData,
          securityData,
          encryptionData,
          featureData,
          modelMetaData,
        ] = await Promise.all([
          dashboardService.getDashboardStats(),
          dashboardService.getMessageTrend(),
          dashboardService.getActivitySampling(),
          dashboardService.getPlatformRanks(),
          dashboardService.getRecentActivities(),
          dashboardService.getClassificationSummary(),
          dashboardService.getSecurityStatus(),
          dashboardService.getEncryptionStats(),
          dashboardService.getFeatureStats(),
          dashboardService.getModelMetadata().catch(() => null),
        ]);

        setStats(statsData);
        setTrendData(trendRaw);
        setSampling(samplingData);
        setRanks(ranksData);
        setActivities(activitiesData);
        setClsDist(clsData);
        setSecurity(securityData);
        setEncryption(encryptionData);
        setFeatureStats(featureData);
        setModelMeta(modelMetaData);
      } catch (error) {
        console.error('Failed to fetch dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  // Top 5 bulan tersibuk dihitung dari trendData real
  const months = [...trendData]
    .sort((a, b) => b.input - a.input)
    .slice(0, 5)
    .map((d, idx) => ({ n: `No.${idx + 1}`, v: d.input.toString(), m: d.month_label }));
  const clsChartData = clsDist ? [
    { name: 'Tidak Berisiko', value: clsDist.normal,   fill: 'var(--chart-3)' },
    { name: 'Berisiko',       value: clsDist.berisiko, fill: '#EF4444' },
  ] : [];

  if (loading) {
    return <LoadingSkeleton />;
  }

  return (
    <div className="dash">
      {/* Stats row */}
      <div className="stats-grid">
        <Stat 
          label="Total Pengguna" 
          value={stats?.total_users} 
          delta="12.4%" 
          up 
          icon={Users} 
          loading={loading} 
        />
        <Stat 
          label="Total Pesan" 
          value={stats?.total_messages} 
          delta="Real-time" 
          up 
          icon={MessageCircle} 
          loading={loading} 
        />
        <Stat 
          label="Sesi Aktif" 
          value={stats?.active_sessions} 
          delta="8.3%" 
          up 
          icon={Activity} 
          loading={loading} 
        />
        <Stat 
          label="E2E Encrypted" 
          value={`${stats?.encrypted_percent || 0}%`} 
          delta="Aman" 
          up 
          icon={Shield} 
          loading={loading} 
        />
      </div>

      {/* Top row */}
      <div className="grid-12">
        <Card title="Distribusi Katalog" subtitle="Penggunaan fitur utama" className="col-3">
          <ResponsiveContainer width="100%" height={210}>
            <RadialBarChart innerRadius="35%" outerRadius="100%" data={catalog} startAngle={90} endAngle={-270}>
              <RadialBar background={{ fill: 'var(--surface-2)' }} dataKey="value" cornerRadius={10} />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="legend-list">
            {catalog.map(c => (
              <div key={c.name} className="legend-row">
                <span className="dot" style={{ background: c.fill }} /> {c.name}
                <strong>{c.value.toLocaleString()}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card
          title="Trend Pesan"
          subtitle="Input vs Output 12 bulan terakhir"
          action={<div className="trend-stats">
            <span><b>{stats?.total_messages?.toLocaleString() || '0'}</b><Badge tone="success">Total Input</Badge></span>
            <span><b>{stats?.total_messages?.toLocaleString() || '0'}</b><Badge tone="brand">Total Output</Badge></span>
          </div>}
          className="col-6"
        >
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={trendData}>
              <defs>
                <linearGradient id="g1" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.6}/>
                  <stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="g2" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="var(--brand)" stopOpacity={0.55}/>
                  <stop offset="100%" stopColor="var(--brand)" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="month" stroke="var(--text-muted)" fontSize={11}/>
              <YAxis stroke="var(--text-muted)" fontSize={11}/>
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}/>
              <Area type="monotone" dataKey="input" stroke="var(--chart-2)" fill="url(#g1)" strokeWidth={2}/>
              <Area type="monotone" dataKey="output" stroke="var(--brand)" fill="url(#g2)" strokeWidth={2}/>
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Status Katalog" subtitle="Aktivitas pengguna real-time" className="col-3">
          <ResponsiveContainer width="100%" height={180}>
            <PieChart>
              <Pie data={status} dataKey="value" innerRadius={45} outerRadius={70} paddingAngle={3}>
                {status.map(s => <Cell key={s.name} fill={s.fill}/>)}
              </Pie>
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}/>
            </PieChart>
          </ResponsiveContainer>
          <div className="legend-list">
            {status.map(s => (
              <div key={s.name} className="legend-row">
                <span className="dot" style={{ background: s.fill }}/> {s.name}
                <strong>{s.value}%</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Middle row */}
      <div className="grid-12">
        <Card title="Distribusi Departemen" subtitle="Pemakaian per modul" className="col-3">
          <ResponsiveContainer width="100%" height={240}>
            <RadarChart data={radar}>
              <PolarGrid stroke="var(--border)"/>
              <PolarAngleAxis dataKey="area" stroke="var(--text-muted)" fontSize={11}/>
              <PolarRadiusAxis stroke="var(--border)" fontSize={10}/>
              <Radar dataKey="a" stroke="var(--brand)" fill="var(--brand)" fillOpacity={0.35}/>
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Top 5 Bulan Tersibuk" className="col-6">
          <div className="months-row">
            {months.map(m => (
              <div key={m.n} className="month-card">
                <span className="month-rank">{m.n}</span>
                <strong>{Number(m.v).toLocaleString()}</strong>
                <span className="month-label">{m.m}</span>
              </div>
            ))}
          </div>
          <div className="rings-row">
            {circles.map(c => <Ring key={c.label} {...c} loading={loading} />)}
          </div>
        </Card>

        <Card title="Peringkat Interface" subtitle="Akses per platform" className="col-3">
          <div className="ranks">
            {ranks.map(r => (
              <div key={r.label} className="rank-row">
                <span>{r.label}</span>
                <div className="rank-bar"><div style={{ width: `${Math.min(r.value * 2, 100)}%` }}/></div>
                <strong>{r.value}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Bottom row */}
      <div className="grid-12">
        <Card title="Data Sampling" subtitle="Pesan per hari (minggu ini)" className="col-6">
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={sampling}>
              <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" vertical={false}/>
              <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={11}/>
              <YAxis stroke="var(--text-muted)" fontSize={11}/>
              <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}/>
              <Bar dataKey="value" fill="var(--brand)" radius={[6,6,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card title="Aktivitas Terbaru" className="col-6">
          <ul className="activity">
            {activities.map((x, i) => (
              <li key={i}>
                <div className="avatar" style={{ width: 34, height: 34, fontSize: 12 }}>
                  {x.user.slice(0, 2).toUpperCase()}
                </div>
                <div className="activity-text">
                  <strong>{x.user}</strong> {x.action}
                  <span>{x.time}</span>
                </div>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* Row 4: Filter AI, Pusat Keamanan, Kriptografi (desain premium) */}
      <div className="grid-12">
        <Card
          title="Filter AI & Klasifikasi"
          subtitle={`Distribusi 2 kelas (Aman vs Berisiko) · Akurasi Model ${
            modelMeta?.accuracy_test ? (modelMeta.accuracy_test * 100).toFixed(2) + '%' : '93.00%'
          }`}
          className="col-4"
          action={
            <button onClick={() => navigate('/classification')} className="dash-cls-link">
              Detail AI <Brain size={13} />
            </button>
          }
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, alignItems: 'center', marginTop: 10 }}>
            <ResponsiveContainer width="100%" height={160}>
              <PieChart>
                <Pie data={clsChartData} dataKey="value" innerRadius={50} outerRadius={75} paddingAngle={3}>
                  {clsChartData.map(d => <Cell key={d.name} fill={d.fill} />)}
                </Pie>
                <Tooltip contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="legend-list" style={{ width: '100%', gap: 8 }}>
              {clsChartData.map(d => (
                <div key={d.name} className="legend-row" style={{ padding: '6px 12px', background: 'var(--surface-2)', borderRadius: 8 }}>
                  <span className="dot" style={{ background: d.fill }} />
                  <span style={{ fontWeight: 500 }}>{d.name}</span>
                  <strong>{d.value.toLocaleString()} Pesan</strong>
                </div>
              ))}
            </div>
          </div>
        </Card>

        <Card title="Pusat Keamanan Sistem" subtitle="Status komponen Anti-Malware & Hoaks" className="col-4">
          <div className="legend-list" style={{ gap: 12, marginTop: 14 }}>
            {[
              { label: 'Filter Spam/Teks Berbahaya',  status: security?.spam_filter       ? 'Berjalan Aktif' : 'Nonaktif', color: security?.spam_filter       ? '#22C55E' : '#EF4444' },
              { label: 'Deteksi Ancaman Kriminal',    status: security?.threat_detection  ? 'Berjalan Aktif' : 'Nonaktif', color: security?.threat_detection  ? '#22C55E' : '#EF4444' },
              { label: 'Anti-Hoaks & Misinformasi',   status: security?.anti_hoax         ? 'Berjalan Aktif' : 'Nonaktif', color: security?.anti_hoax         ? '#22C55E' : '#EF4444' },
              { label: 'Pembaharuan Model AI',        status: security?.model_updated || 'Tidak Diketahui', color: 'var(--brand)'    },
              { label: 'Total Pesan Terklasifikasi',  status: `${security?.classified_today?.toLocaleString() ?? '0'} hari ini`, color: 'var(--chart-2)' },
            ].map(item => (
              <div key={item.label} className="legend-row" style={{ fontSize: 13, padding: '9px 12px', background: 'var(--surface-2)', borderRadius: 8 }}>
                <span className="dot" style={{ background: item.color }} />
                <span style={{ flex: 1, fontWeight: 500 }}>{item.label}</span>
                <strong style={{ color: item.color }}>{item.status}</strong>
              </div>
            ))}
          </div>
        </Card>

        <Card title="Kriptografi & Enkripsi" subtitle="Statistik keamanan End-to-End Encryption" className="col-4">
          <div className="legend-list" style={{ gap: 12, marginTop: 14 }}>
            {[
              { label: 'Algoritma AES (Pesan)', status: encryption?.aes_status || 'Aktif',     sub: '',                                                                    color: '#22C55E'         },
              { label: 'Algoritma RSA (Kunci)', status: encryption?.rsa_status || 'Aktif',     sub: '',                                                                    color: '#22C55E'         },
              { label: 'Adopsi Kunci Publik RSA', status: `${encryption?.percentage_users_rsa ?? 0}%`, sub: `${encryption?.total_users_rsa?.toLocaleString() ?? 0} Pengguna`, color: 'var(--brand)'  },
              { label: 'Penetrasi Pesan E2EE',  status: `${encryption?.percentage_e2ee ?? 0}%`,        sub: `${encryption?.e2ee_messages_total?.toLocaleString() ?? 0} Pesan`,  color: 'var(--chart-3)' },
            ].map(item => (
              <div key={item.label} className="legend-row" style={{ fontSize: 13, padding: '9px 12px', background: 'var(--surface-2)', borderRadius: 8, alignItems: 'center' }}>
                <span className="dot" style={{ background: item.color }} />
                <div style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
                  <span style={{ fontWeight: 500 }}>{item.label}</span>
                  {item.sub && <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>{item.sub}</span>}
                </div>
                <strong style={{ color: item.color, fontSize: 14 }}>{item.status}</strong>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};