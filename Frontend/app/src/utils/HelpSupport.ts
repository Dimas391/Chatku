import { FAQ, ContactOption } from '@/app/src/hooks/HelpSupport';
import { Linking } from 'react-native';

export const FAQS: FAQ[] = [
  {
    id: '1',
    category: 'Akun',
    question: 'Bagaimana cara mengubah nomor telepon saya?',
    answer:
      'Buka Profil → Edit → Nomor Telepon. Masukkan nomor baru dan verifikasi dengan kode OTP yang dikirim ke nomor tersebut. Proses biasanya selesai dalam 2 menit.',
  },
  {
    id: '2',
    category: 'Akun',
    question: 'Lupa PIN, bagaimana cara reset?',
    answer:
      'Buka Pengaturan → Keamanan → Ganti PIN → pilih "Lupa PIN". Anda akan diminta verifikasi melalui email atau nomor telepon terdaftar untuk membuat PIN baru.',
  },
  {
    id: '3',
    category: 'Pesan',
    question: 'Mengapa pesan saya tidak terkirim?',
    answer:
      'Pastikan koneksi internet Anda stabil. Pesan dengan tanda ✓ tunggal artinya terkirim ke server, ✓✓ artinya terkirim ke perangkat penerima, dan ✓✓ biru artinya sudah dibaca. Jika masih gagal, coba restart aplikasi.',
  },
  {
    id: '4',
    category: 'Pesan',
    question: 'Bisakah saya menghapus pesan yang sudah dikirim?',
    answer:
      'Ya. Tekan lama pada pesan → pilih "Hapus" → pilih "Hapus untuk Semua". Pesan dapat dihapus dalam waktu 7 hari setelah dikirim. Setelah dihapus, pesan akan digantikan dengan keterangan "Pesan telah dihapus".',
  },
  {
    id: '5',
    category: 'Privasi',
    question: 'Bagaimana cara memblokir seseorang?',
    answer:
      'Buka percakapan dengan orang tersebut → ketuk nama di bagian atas → gulir ke bawah → pilih "Blokir Kontak". Orang yang diblokir tidak dapat mengirim pesan atau melihat status online Anda.',
  },
  {
    id: '6',
    category: 'Privasi',
    question: 'Apakah pesan saya aman dan terenkripsi?',
    answer:
      'Ya. Semua pesan, foto, video, dan panggilan dilindungi dengan enkripsi end-to-end menggunakan protokol Signal. Bahkan tim kami tidak dapat membaca pesan Anda.',
  },
  {
    id: '7',
    category: 'Teknis',
    question: 'Aplikasi sering crash, apa solusinya?',
    answer:
      'Coba langkah berikut:\n1. Perbarui aplikasi ke versi terbaru\n2. Restart perangkat Anda\n3. Bersihkan cache aplikasi di Pengaturan perangkat\n4. Hapus dan instal ulang aplikasi\n\nJika masih bermasalah, hubungi dukungan kami.',
  },
  {
    id: '8',
    category: 'Teknis',
    question: 'Notifikasi tidak muncul, bagaimana cara memperbaikinya?',
    answer:
      'Pastikan izin notifikasi diaktifkan di Pengaturan perangkat → Aplikasi → [Nama App] → Notifikasi. Periksa juga pengaturan baterai — mode hemat daya bisa menghambat notifikasi. Di dalam aplikasi, cek Pengaturan → Notifikasi.',
  },
];

export const CATEGORIES = ['Semua', 'Akun', 'Pesan', 'Privasi', 'Teknis'];

export const getContactOptions = (): ContactOption[] => [
  {
    id: 'email',
    icon: 'email-outline',
    label: 'Email Dukungan',
    sublabel: 'dimskur98@gmail.com',
    color: '#FF6B35',
    onPress: () => Linking.openURL('mailto:dimskur98@gmail.com'),
  },
  {
    id: 'whatsapp',
    icon: 'whatsapp',
    label: 'WhatsApp',
    sublabel: '+6283848581998',
    color: '#25D366',
    onPress: () => Linking.openURL('https://wa.me/6283848581998'),
  },
];