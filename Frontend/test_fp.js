const clientClassificationService = require('e:/Messaging_Pengamanan_Data/Frontend/app/src/services/clientClassificationService').default;

const texts = [
  "Untuk tugas akhir nanti, kita perlu mengimplementasikan algoritma AES-256 dan RSA dalam modul keamanan chat. Jadi semua teks asli akan diubah menjadi ciphertext sebelum masuk ke MongoDB.",
  "Selamat siang Dokter, saya ingin berkonsultasi mengenai keluhan pada organ reproduksi saya. Ada radang dan nyeri di sekitar alat vital yang terasa mengganggu sejak dua hari lalu. Mohon arahannya, Dok.",
  "Tolong! Tolong respon pesan ini segera! Akun perbankan saya baru saja diretas orang dan saya kehilangan akses total. Saya sangat panik, apakah data yang saya simpan di aplikasi ini masih aman?"
];

texts.forEach(text => {
  console.log('---');
  console.log('Text:', text);
  const result = clientClassificationService.classify(text);
  console.log('Result:', result);
});
