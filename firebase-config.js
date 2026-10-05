// ISI FILE INI SAJA, file lain tidak perlu diubah.
//
// Cara dapat config:
// 1. Buka https://console.firebase.google.com, buat project baru.
// 2. Menu Build > Firestore Database > Create database.
// 3. Project settings (ikon roda gigi) > Your apps > ikon web (</>) > daftarkan app.
// 4. Salin nilai firebaseConfig yang muncul ke bawah ini.
// 5. Di Firestore > Rules, tempel aturan berikut lalu Publish:
//
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{db}/documents {
//        match /jadwal/{id} { allow read, write: if true; }
//        match /kontrol/{id} { allow read, write: if true; }
//      }
//    }
//
//    Catatan: aturan ini terbuka untuk siapa saja yang punya link.
//    Bagikan link halaman hanya ke keluarga.

export const firebaseConfig = {
    apiKey: "AIzaSyAdmnCJuB0GU7uIxEDD13lGjvyqqvb_Lx4",
    authDomain: "caregiver-2.firebaseapp.com",
    projectId: "caregiver-2",
    storageBucket: "caregiver-2.firebasestorage.app",
    messagingSenderId: "369406340970",
    appId: "1:369406340970:web:281af8779b126c1d6c3f13"

};
