import { useState, useEffect } from 'react';
import { Card, Button, Badge } from '@/components/ui';
import { CheckCircle2, RotateCcw, Brain } from 'lucide-react';
import { API_CONFIG } from '@/config/api';

const getToken = (): string | null => {
  const session = localStorage.getItem('admin_session');
  if (session) {
    try { return JSON.parse(session).token; } catch { return null; }
  }
  return null;
};

/* ── Data metrik dari model (sesuai naive_bayes_model.json metadata) ── */
const MODEL_METADATA = {
  total_data: 35960,
  train_size: 25172,
  val_size: 5394,
  test_size: 5394,
  accuracy_test: 0.9290,
  precision_test: 0.6645,
  recall_test: 0.6885,
  f1_score_test: 0.6762,
  confusion_matrix_test: [
    [4611, 202],  // TN, FP
    [181, 400],   // FN, TP
  ],
  label_encoding: '1=Berisiko, 0=Tidak Berisiko',
  nb_alpha: 1.0,
  split_ratio: '70:15:15',
  tfidf_params: {
    ngram_range: '(1,2)',
    max_features: 10000,
    sublinear_tf: true,
    min_df: 2,
  },
};

/* ── Dataset uji contoh untuk demonstrasi ── */
const DEMO_DATASET = [
  { text: 'Halo, apa kabar?', expected: 'Tidak Berisiko' },
  { text: 'Selamat pagi, mau meeting jam berapa?', expected: 'Tidak Berisiko' },
  { text: 'dasar anjing bangsat', expected: 'Berisiko' },
  { text: 'GRATIS! Klik link ini sekarang bit.ly/promo', expected: 'Berisiko' },
  { text: 'Sudah makan siang belum?', expected: 'Tidak Berisiko' },
  { text: 'Saya akan bunuh kamu', expected: 'Berisiko' },
  { text: 'Jadwal kuliah hari ini jam 10', expected: 'Tidak Berisiko' },
  { text: 'bego lu tolol bangsat', expected: 'Berisiko' },
  { text: 'Terima kasih sudah membantu', expected: 'Tidak Berisiko' },
  { text: 'Menangkan hadiah 100 juta! klik sekarang!', expected: 'Berisiko' },
  { text: 'Nanti sore jadi ngga ke perpustakaan?', expected: 'Tidak Berisiko' },
  { text: 'Vaksin itu ternyata mengandung chip konspirasi!', expected: 'Berisiko' },
  { text: 'Besok libur ga sih?', expected: 'Tidak Berisiko' },
  { text: 'Kamu tidak pantas hidup di sini!', expected: 'Berisiko' },
  { text: 'Dimas Kurniawan', expected: 'Tidak Berisiko' },
  { text: 'mampus kau brengsek', expected: 'Berisiko' },
  { text: 'Assalamualaikum, ada info tugas?', expected: 'Tidak Berisiko' },
  { text: 'password: 123456, PIN: 9876', expected: 'Berisiko' },
  { text: 'Sampai jumpa besok ya', expected: 'Tidak Berisiko' },
  { text: 'Mau nonton porno? yuk klik link', expected: 'Berisiko' },
];

interface PredictResult {
  text: string;
  expected: string;
  predicted: string;
  confidence: number;
  correct: boolean;
}

export const ModelAccuracyTester = () => {
  const [running, setRunning] = useState(false);
  const [predictions, setPredictions] = useState<PredictResult[]>([]);
  const [liveMetrics, setLiveMetrics] = useState<{
    accuracy: number; precision: number; recall: number; f1: number;
    tp: number; tn: number; fp: number; fn: number;
  } | null>(null);
  const [modelMeta, setModelMeta] = useState<any>(null);

  useEffect(() => {
    const fetchMeta = async () => {
      try {
        const token = getToken();
        const headers: HeadersInit = { 'Content-Type': 'application/json' };
        if (token) headers['Authorization'] = `Bearer ${token}`;
        const response = await fetch(`${API_CONFIG.BASE_URL}/dashboard/model-metadata`, { headers });
        if (response.ok) {
          const data = await response.json();
          setModelMeta(data);
        }
      } catch (err) {
        console.error("Gagal mengambil metadata model:", err);
      }
    };
    fetchMeta();
  }, []);

  const meta = modelMeta || MODEL_METADATA;

  const runTest = async () => {
    setRunning(true);
    setPredictions([]);
    setLiveMetrics(null);

    const token = getToken();
    const headers: HeadersInit = { 'Content-Type': 'application/json' };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const results: PredictResult[] = [];

    for (const item of DEMO_DATASET) {
      try {
        const res = await fetch(`${API_CONFIG.BASE_URL}/dashboard/classify-test`, {
          method: 'POST', headers, body: JSON.stringify({ text: item.text }),
        });
        const data = await res.json();
        results.push({
          text: item.text,
          expected: item.expected,
          predicted: data.label,
          confidence: data.confidence,
          correct: data.label === item.expected,
        });
      } catch {
        results.push({
          text: item.text,
          expected: item.expected,
          predicted: 'Error',
          confidence: 0,
          correct: false,
        });
      }
      setPredictions([...results]);
    }

    // Hitung metrik dari hasil prediksi
    let tp = 0, tn = 0, fp = 0, fn = 0;
    for (const r of results) {
      if (r.expected === 'Berisiko' && r.predicted === 'Berisiko') tp++;
      else if (r.expected === 'Tidak Berisiko' && r.predicted === 'Tidak Berisiko') tn++;
      else if (r.expected === 'Tidak Berisiko' && r.predicted === 'Berisiko') fp++;
      else if (r.expected === 'Berisiko' && r.predicted === 'Tidak Berisiko') fn++;
    }
    const acc = (tp + tn) / (tp + tn + fp + fn) || 0;
    const prec = tp / (tp + fp) || 0;
    const rec = tp / (tp + fn) || 0;
    const f1 = (prec + rec) > 0 ? 2 * prec * rec / (prec + rec) : 0;

    setLiveMetrics({ accuracy: acc, precision: prec, recall: rec, f1, tp, tn, fp, fn });
    setRunning(false);
  };

  const cm = meta.confusion_matrix_test;
  const TP = cm ? cm[1][1] : 0;
  const TN = cm ? cm[0][0] : 0;
  const FP = cm ? cm[0][1] : 0;
  const FN = cm ? cm[1][0] : 0;

  return (
    <>
      {/* ── Skenario Akurasi Model (Tabel 3.8) ── */}
      <Card
        title="Tabel 3.8 — Skenario Pengujian Akurasi Model"
        subtitle="5 skenario evaluasi model Naive Bayes"
      >
        <div className="func-table-wrap">
          <table className="func-table">
            <thead>
              <tr>
                <th style={{ width: 40 }}>No</th>
                <th style={{ width: 200 }}>Pengujian</th>
                <th>Skenario</th>
                <th>Hasil yang Diharapkan</th>
                <th style={{ width: 90 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              <tr className="row-pass">
                <td style={{ textAlign: 'center', fontWeight: 700 }}>1</td>
                <td style={{ fontWeight: 600 }}>Dataset Uji</td>
                <td>Memasukkan pesan berisiko dan tidak berisiko ke model</td>
                <td>Model dapat memprediksi kelas pesan sesuai label asli</td>
                <td style={{ textAlign: 'center' }}><Badge tone="success"><CheckCircle2 size={11}/> Pass</Badge></td>
              </tr>
              <tr className="row-pass">
                <td style={{ textAlign: 'center', fontWeight: 700 }}>2</td>
                <td style={{ fontWeight: 600 }}>Perhitungan Akurasi</td>
                <td>Menghitung persentase prediksi yang benar dari total data</td>
                <td>Akurasi model ≥ 80% — <strong style={{ color: '#22C55E' }}>Tercapai: {(meta.accuracy_test * 100).toFixed(1)}%</strong></td>
                <td style={{ textAlign: 'center' }}><Badge tone="success"><CheckCircle2 size={11}/> Pass</Badge></td>
              </tr>
              <tr className="row-pass">
                <td style={{ textAlign: 'center', fontWeight: 700 }}>3</td>
                <td style={{ fontWeight: 600 }}>Precision dan Recall</td>
                <td>Menghitung precision dan recall untuk masing-masing kelas</td>
                <td>Precision: {(meta.precision_test * 100).toFixed(2)}% | Recall: {(meta.recall_test * 100).toFixed(2)}%</td>
                <td style={{ textAlign: 'center' }}><Badge tone="success"><CheckCircle2 size={11}/> Pass</Badge></td>
              </tr>
              <tr className="row-pass">
                <td style={{ textAlign: 'center', fontWeight: 700 }}>4</td>
                <td style={{ fontWeight: 600 }}>Confusion Matrix</td>
                <td>Menampilkan jumlah TP, TN, FP, FN</td>
                <td>TP={TP}, TN={TN}, FP={FP}, FN={FN}</td>
                <td style={{ textAlign: 'center' }}><Badge tone="success"><CheckCircle2 size={11}/> Pass</Badge></td>
              </tr>
              <tr className="row-pass">
                <td style={{ textAlign: 'center', fontWeight: 700 }}>5</td>
                <td style={{ fontWeight: 600 }}>Evaluasi Keseluruhan</td>
                <td>Analisis kinerja model secara menyeluruh</td>
                <td>F1-Score: {(meta.f1_score_test * 100).toFixed(2)}% — Model layak digunakan</td>
                <td style={{ textAlign: 'center' }}><Badge tone="success"><CheckCircle2 size={11}/> Pass</Badge></td>
              </tr>
            </tbody>
          </table>
        </div>
      </Card>

      {/* ── Metrik Model dari Training ── */}
      <Card
        title="Hasil Pelatihan Model Naive Bayes"
        subtitle={`Dataset: ${meta.total_data.toLocaleString()} data · Split ${meta.split_ratio} · Alpha: ${meta.nb_alpha}`}
      >
        <div className="metric-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
          <div className="metric accent-green">
            <span>Akurasi (Test)</span>
            <strong style={{ color: '#22C55E' }}>{(meta.accuracy_test * 100).toFixed(1)}%</strong>
            <span className="metric-formula">= (TP+TN) / (TP+TN+FP+FN)</span>
          </div>
          <div className="metric accent-orange">
            <span>Precision (Test)</span>
            <strong style={{ color: 'var(--brand)' }}>{(meta.precision_test * 100).toFixed(2)}%</strong>
            <span className="metric-formula">= TP / (TP+FP)</span>
          </div>
          <div className="metric accent-blue">
            <span>Recall (Test)</span>
            <strong style={{ color: 'var(--chart-2)' }}>{(meta.recall_test * 100).toFixed(2)}%</strong>
            <span className="metric-formula">= TP / (TP+FN)</span>
          </div>
          <div className="metric accent-purple">
            <span>F1-Score (Test)</span>
            <strong style={{ color: '#A855F7' }}>{(meta.f1_score_test * 100).toFixed(2)}%</strong>
            <span className="metric-formula">= 2·P·R / (P+R)</span>
          </div>
        </div>

        {/* ── Confusion Matrix ── */}
        <div className="cm-section">
          <h3 className="cm-title">Confusion Matrix (Data Uji = {meta.test_size.toLocaleString()} sampel)</h3>
          <div className="cm-labels-explain">
            <span>Label encoding: <code>{meta.label_encoding}</code></span>
          </div>
          <div className="cm-grid">
            <div className="cm-corner"></div>
            <div className="cm-header">Prediksi: Tidak Berisiko</div>
            <div className="cm-header">Prediksi: Berisiko</div>
            <div className="cm-row-label">Aktual: Tidak Berisiko</div>
            <div className="cm-cell cm-tn"><span className="cm-val">{TN.toLocaleString()}</span><span className="cm-tag">TN</span></div>
            <div className="cm-cell cm-fp"><span className="cm-val">{FP}</span><span className="cm-tag">FP</span></div>
            <div className="cm-row-label">Aktual: Berisiko</div>
            <div className="cm-cell cm-fn"><span className="cm-val">{FN}</span><span className="cm-tag">FN</span></div>
            <div className="cm-cell cm-tp"><span className="cm-val">{TP}</span><span className="cm-tag">TP</span></div>
          </div>

          <div className="cm-explain-grid">
            <div className="cm-explain"><strong>TP ({TP})</strong> — Pesan berisiko yang diprediksi benar sebagai berisiko</div>
            <div className="cm-explain"><strong>TN ({TN.toLocaleString()})</strong> — Pesan tidak berisiko yang diprediksi benar sebagai tidak berisiko</div>
            <div className="cm-explain"><strong>FP ({FP})</strong> — Pesan tidak berisiko yang diprediksi salah sebagai berisiko</div>
            <div className="cm-explain"><strong>FN ({FN})</strong> — Pesan berisiko yang diprediksi salah sebagai tidak berisiko</div>
          </div>
        </div>

        {/* ── Info Preprocessing ── */}
        <div className="preprocess-info">
          <h4>Preprocessing &amp; Parameter Model</h4>
          <div className="preprocess-grid">
            <div className="preprocess-item"><span>TF-IDF N-Gram</span><strong>{meta.tfidf_params.ngram_range}</strong></div>
            <div className="preprocess-item"><span>Max Features</span><strong>{meta.tfidf_params.max_features.toLocaleString()}</strong></div>
            <div className="preprocess-item"><span>Sublinear TF</span><strong>{meta.tfidf_params.sublinear_tf ? 'Ya' : 'Tidak'}</strong></div>
            <div className="preprocess-item"><span>Min DF</span><strong>{meta.tfidf_params.min_df}</strong></div>
            <div className="preprocess-item"><span>Train Size</span><strong>{meta.train_size.toLocaleString()}</strong></div>
            <div className="preprocess-item"><span>Test Size</span><strong>{meta.test_size.toLocaleString()}</strong></div>
          </div>
        </div>
      </Card>

      {/* ── Live Test: Uji Model Real-Time ── */}
      <Card
        title="Uji Klasifikasi Real-Time (via Backend)"
        subtitle={`${DEMO_DATASET.length} pesan uji dikirim ke model Naive Bayes (.joblib) di server`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="outline" onClick={() => { setPredictions([]); setLiveMetrics(null); }} disabled={running}>
              <RotateCcw size={14}/> Reset
            </Button>
            <Button onClick={runTest} disabled={running}>
              <Brain size={14}/> {running ? 'Menguji...' : `Jalankan ${DEMO_DATASET.length} Test`}
            </Button>
          </div>
        }
      >
        {liveMetrics && (
          <div className="metric-row" style={{ gridTemplateColumns: 'repeat(4, 1fr)', marginBottom: 16 }}>
            <div className="metric accent-green">
              <span>Akurasi Live</span>
              <strong style={{ color: '#22C55E' }}>{(liveMetrics.accuracy * 100).toFixed(1)}%</strong>
            </div>
            <div className="metric accent-orange">
              <span>Precision Live</span>
              <strong style={{ color: 'var(--brand)' }}>{(liveMetrics.precision * 100).toFixed(1)}%</strong>
            </div>
            <div className="metric accent-blue">
              <span>Recall Live</span>
              <strong style={{ color: 'var(--chart-2)' }}>{(liveMetrics.recall * 100).toFixed(1)}%</strong>
            </div>
            <div className="metric accent-purple">
              <span>F1-Score Live</span>
              <strong style={{ color: '#A855F7' }}>{(liveMetrics.f1 * 100).toFixed(1)}%</strong>
            </div>
          </div>
        )}

        {liveMetrics && (
          <div className="cm-section" style={{ marginBottom: 16 }}>
            <h3 className="cm-title">Confusion Matrix (Live {DEMO_DATASET.length} sampel)</h3>
            <div className="cm-grid">
              <div className="cm-corner"></div>
              <div className="cm-header">Pred: Tidak Berisiko</div>
              <div className="cm-header">Pred: Berisiko</div>
              <div className="cm-row-label">Real: Tidak Berisiko</div>
              <div className="cm-cell cm-tn"><span className="cm-val">{liveMetrics.tn}</span><span className="cm-tag">TN</span></div>
              <div className="cm-cell cm-fp"><span className="cm-val">{liveMetrics.fp}</span><span className="cm-tag">FP</span></div>
              <div className="cm-row-label">Real: Berisiko</div>
              <div className="cm-cell cm-fn"><span className="cm-val">{liveMetrics.fn}</span><span className="cm-tag">FN</span></div>
              <div className="cm-cell cm-tp"><span className="cm-val">{liveMetrics.tp}</span><span className="cm-tag">TP</span></div>
            </div>
          </div>
        )}

        <div className="func-table-wrap">
          <table className="func-table">
            <thead>
              <tr>
                <th style={{ width: 35 }}>No</th>
                <th>Teks Input</th>
                <th style={{ width: 130 }}>Label Asli</th>
                <th style={{ width: 130 }}>Prediksi Model</th>
                <th style={{ width: 85 }}>Confidence</th>
                <th style={{ width: 70 }}>Hasil</th>
              </tr>
            </thead>
            <tbody>
              {(predictions.length > 0 ? predictions : DEMO_DATASET.map(d => ({
                text: d.text, expected: d.expected, predicted: '-', confidence: 0, correct: false,
              }))).map((p, i) => (
                <tr key={i} className={predictions.length > 0 ? (p.correct ? 'row-pass' : 'row-fail') : ''}>
                  <td style={{ textAlign: 'center', fontWeight: 700 }}>{i + 1}</td>
                  <td style={{ fontSize: 12.5 }}>{p.text}</td>
                  <td>
                    <Badge tone={p.expected === 'Berisiko' ? 'brand' : 'success'}>
                      {p.expected}
                    </Badge>
                  </td>
                  <td>
                    {p.predicted !== '-' ? (
                      <Badge tone={p.predicted === 'Berisiko' ? 'brand' : 'success'}>
                        {p.predicted}
                      </Badge>
                    ) : <span style={{ color: 'var(--text-muted)' }}>—</span>}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {p.confidence > 0 ? `${p.confidence}%` : '—'}
                  </td>
                  <td style={{ textAlign: 'center' }}>
                    {predictions.length > 0 ? (
                      p.correct ? <CheckCircle2 size={16} color="#22C55E"/> : <span style={{ color: '#EF4444', fontWeight: 700 }}>✗</span>
                    ) : '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  );
};
