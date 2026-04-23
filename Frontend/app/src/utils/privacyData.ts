import { Section } from '@/app/src/hooks/PrivacyPolicy';

export const SECTIONS: Section[] = [
  {
    id: '1',
    icon: 'database-outline',
    title: 'Data yang Kami Kumpulkan',
    content:
      'Kami mengumpulkan informasi yang Anda berikan saat mendaftar, termasuk nama, nomor telepon, dan alamat email. Kami juga mengumpulkan data penggunaan seperti waktu aktif, pesan yang dikirim (terenkripsi end-to-end), dan log teknis untuk meningkatkan layanan.\n\nKami tidak pernah menjual data pribadi Anda kepada pihak ketiga.',
  },
  {
    id: '2',
    icon: 'lock-outline',
    title: 'Keamanan & Enkripsi',
    content:
      'Semua pesan dilindungi dengan enkripsi end-to-end menggunakan protokol Signal. Artinya hanya Anda dan penerima yang dapat membaca pesan — bahkan kami tidak dapat mengaksesnya.\n\nData yang disimpan di server kami dienkripsi menggunakan AES-256. Kami melakukan audit keamanan secara berkala oleh pihak ketiga independen.',
  },
  {
    id: '3',
    icon: 'share-variant-outline',
    title: 'Berbagi Data',
    content:
      'Kami tidak berbagi informasi pribadi Anda dengan pihak ketiga untuk tujuan komersial. Data hanya dapat dibagikan dalam kondisi berikut:\n\n• Atas permintaan hukum yang sah\n• Untuk mencegah ancaman keselamatan yang serius\n• Dengan persetujuan eksplisit Anda\n\nMitra layanan kami (hosting, analitik) tunduk pada perjanjian kerahasiaan yang ketat.',
  },
  {
    id: '4',
    icon: 'account-cog-outline',
    title: 'Kontrol Data Anda',
    content:
      'Anda memiliki kendali penuh atas data Anda:\n\n• Unduh semua data Anda kapan saja\n• Hapus akun dan seluruh data secara permanen\n• Atur visibilitas profil dan status\n• Kelola izin notifikasi dan lokasi\n\nPermintaan penghapusan diproses dalam 30 hari kerja.',
  },
  {
    id: '5',
    icon: 'cookie-outline',
    title: 'Cookie & Pelacakan',
    content:
      'Aplikasi ini menggunakan cookie esensial untuk fungsi dasar seperti autentikasi sesi. Kami tidak menggunakan cookie pelacakan iklan atau cookie analitik pihak ketiga.\n\nAnda dapat menghapus data cache aplikasi kapan saja melalui pengaturan perangkat.',
  },
  {
    id: '6',
    icon: 'baby-face-outline',
    title: 'Perlindungan Anak',
    content:
      'Layanan ini tidak ditujukan untuk anak di bawah 13 tahun. Kami tidak secara sadar mengumpulkan data dari anak-anak. Jika Anda menemukan akun yang dibuat oleh anak di bawah umur, harap laporkan kepada kami segera.',
  },
  {
    id: '7',
    icon: 'update',
    title: 'Pembaruan Kebijakan',
    content:
      'Kebijakan ini terakhir diperbarui pada 1 Januari 2025. Jika kami melakukan perubahan material, kami akan memberi tahu Anda melalui notifikasi dalam aplikasi setidaknya 30 hari sebelum perubahan berlaku.\n\nVersi kebijakan sebelumnya tersedia di website kami.',
  },
];