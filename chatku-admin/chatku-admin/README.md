# ChatKu Admin Panel

Antarmuka web admin untuk aplikasi mobile **ChatKu**. Dibangun dengan
**React + TypeScript + Vite**. Mendukung **mode gelap & terang**,
konsisten dengan warna mobile (`#FF6B35`).

## Fitur

- 📊 **Dashboard** — visualisasi statistik (Area, Radial, Pie, Bar, Radar).
- 👥 **Pengguna** — daftar & pencarian pengguna terdaftar.
- 💬 **Percakapan** — daftar ruang chat aktif.
- 🧪 **Pengujian** — halaman khusus untuk demo sidang:
  - Unit & Integration Test (skenario inti aplikasi)
  - API Tester (uji endpoint backend secara langsung dari browser)
  - Enkripsi End-to-End (simulasi AES-GCM 256-bit via Web Crypto)
- ⚙️ **Pengaturan** — toggle dark mode, info versi.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:5173

## Build Produksi

```bash
npm run build
npm run preview
```

## Struktur

```
src/
├── components/
│   ├── ui/            # Komponen UI dasar (Card, Button, Badge)
│   ├── layout/        # Sidebar & Topbar
│   ├── dashboard/     # Style chart dashboard
│   └── testing/       # TestRunner, ApiTester, EncryptionTester
├── pages/             # Dashboard, Users, Chats, Testing, Settings
├── context/           # ThemeContext (dark/light)
└── styles/            # Global & layout CSS
```

Setiap halaman hanya mengkomposisi komponen dari `components/` — sesuai
permintaan (pages mengambil komponen UI).
