import { useState } from 'react';
import { Card, Badge, Button } from '@/components/ui';
import { FunctionalTester } from '@/components/testing/FunctionalTester';
import { ModelAccuracyTester } from '@/components/testing/ModelAccuracyTester';
import { ApiTester } from '@/components/testing/ApiTester';
import { EncryptionTester } from '@/components/testing/EncryptionTester';
import { PlayCircle, Brain, Server, Lock, CheckCircle2 } from 'lucide-react';
import '@/components/testing/testing.css';

type Tab = 'functional' | 'accuracy' | 'api' | 'crypto';

export const Testing = () => {
  const [tab, setTab] = useState<Tab>('functional');

  return (
    <div className="test-page">
      <Card
        title="Halaman Pengujian Sistem"
        subtitle="Validasi fungsional dan akurasi model klasifikasi ChatKu"
        action={<Badge tone="success">Pengujian Aktif</Badge>}
      >
        <div className="test-tabs">
          <button className={'tab' + (tab === 'functional' ? ' active' : '')} onClick={() => setTab('functional')}>
            <CheckCircle2 size={16}/> Skenario Fungsional
          </button>
          <button className={'tab' + (tab === 'accuracy' ? ' active' : '')} onClick={() => setTab('accuracy')}>
            <Brain size={16}/> Akurasi Model
          </button>
          <button className={'tab' + (tab === 'api' ? ' active' : '')} onClick={() => setTab('api')}>
            <Server size={16}/> API Tester
          </button>
          <button className={'tab' + (tab === 'crypto' ? ' active' : '')} onClick={() => setTab('crypto')}>
            <Lock size={16}/> Simulasi Enkripsi
          </button>
        </div>
      </Card>

      {tab === 'functional' && <FunctionalTester />}
      {tab === 'accuracy' && <ModelAccuracyTester />}
      {tab === 'api' && <ApiTester />}
      {tab === 'crypto' && <EncryptionTester />}
    </div>
  );
};
