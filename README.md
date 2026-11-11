# 🚀 Meteor Blaster

Sebuah game arcade 2D luar angkasa dengan tema *retro-cyberpunk*, fitur peningkatan skill acak berbentuk bola bercahaya, dan sistem papan peringkat online (**Leaderboard**) yang terintegrasi langsung dengan **Supabase Database**.

Tersedia dalam 2 edisi:
1. **Web Edition (HTML5 Canvas + Node.js + Supabase)**
2. **Desktop Edition (Python + Pygame)**

---

## 🕹️ Fitur Utama

- **Spaceship Movement**: Kendalikan pesawat ke atas/bawah untuk menghindari dan menghancurkan meteor.
- **Meteor Lurus dari Kanan**: Seluruh meteor muncul secara acak dari sisi kanan dan bergerak lurus horizontal ke kiri dengan variasi ukuran, kecepatan, dan ketahanan (HP).
- **Glowing Skill Orbs**: Bola energi bulat bercahaya muncul mengambang di area tengah pertempuran secara berkala:
  - 🔵 **3× Shot** (Menembakkan 3 proyektil sekaligus)
  - 🟠 **Damage +50%** (Meningkatkan daya hancur peluru)
  - 🟢 **Speed +30%** (Meningkatkan kecepatan gerak pesawat)
  - 🟡 **Rapid Fire** (Mempercepat jeda tembakan / firing rate)
  - 🟣 **Energy Shield** (Menahan 1 kali tabrakan meteor)
- **3 Lives System**: Memiliki 3 nyawa dengan efek *invincibility frames* saat tertabrak.
- **Leaderboard Online (Supabase)**: Simpan skor dan callsign pilot Anda ke cloud leaderboard global dan lihat peringkat 10 besar secara real-time.
- **Efek Suara Prosedural**: Sintesis suara tembakan, pendorong mesin, ledakan, dan arpeggio kenaikan level menggunakan Web Audio API tanpa memerlukan file audio eksternal.

---

## 🚀 Cara Menjalankan

### Opsi A: Web Edition (Node.js) - Rekomendasi
1. Pastikan Node.js sudah terpasang.
2. Salin template konfigurasi:
   ```bash
   cp .env.example .env
   ```
3. Buka file `.env` dan masukkan kredensial Supabase Anda (`SUPABASE_URL` dan `SUPABASE_KEY`).
4. Jalankan script setup tabel di Supabase SQL Editor dari file `supabase_setup.sql`.
5. Mulai server:
   ```bash
   node server.js
   ```
   *Atau di Windows, cukup klik dua kali file **`start-game.bat`**.*
6. Buka browser di **http://localhost:3000**.

### Opsi B: Desktop Edition (Python / Pygame)
1. Install dependensi:
   ```bash
   pip install pygame
   ```
2. Jalankan game:
   ```bash
   python space_shooter.py
   ```

---

## 🎮 Kontrol Permainan

| Tombol | Aksi |
|---|---|
| **W** / **↑** | Gerak Ke Atas |
| **S** / **↓** | Gerak Ke Bawah |
| **SPACE** *(tahan)* | Tembak Otomatis (Auto-Fire) |
| **L** | Buka / Tutup Leaderboard |
| **P** / **ESC** | Pause Permainan |

---

## 📄 Lisensi
MIT License
