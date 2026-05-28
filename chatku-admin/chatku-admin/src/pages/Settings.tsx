import { Card, Button } from '@/components/ui';
import { useTheme } from '@/context/ThemeContext';

export const Settings = () => {
  const { theme, toggle } = useTheme();
  return (
    <div style={{ display: 'grid', gap: 16 }}>
      <Card title="Tampilan" subtitle="Sesuaikan tema admin panel">
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>Mode Gelap</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>Saat ini: {theme}</div>
          </div>
          <Button onClick={toggle}>Toggle ke {theme === 'dark' ? 'Terang' : 'Gelap'}</Button>
        </div>
      </Card>
      <Card title="Tentang" subtitle="ChatKu Admin Panel">
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.7 }}>
          Versi 1.0.0 — Dibangun dengan React + TypeScript + Vite, sebagai antarmuka admin untuk
          aplikasi mobile ChatKu (React Native & FastAPI). Skema warna dan identitas visual
          disinkronkan dengan aplikasi mobile (#FF6B35).
        </p>
      </Card>
    </div>
  );
};
