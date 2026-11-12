# 🚀 Meteor Blaster

Sebuah game arcade 2D luar angkasa dengan tema *retro-cyberpunk*, fitur peningkatan skill acak berbentuk bola bercahaya, dan sistem papan peringkat online (**Leaderboard**) yang terintegrasi langsung dengan **Supabase Database**.

Tersedia dalam 2 edisi:
1. **Web Edition (HTML5 Canvas + Node.js + Supabase)**
2. **Desktop Edition (Python + Pygame)**

---

## 🕹️ Fitur Utama

- **Base Defense (10.000 HP)**: Base pertahanan di sisi kiri memiliki 10.000 HP dengan kubah perisai energi. Setiap meteor atau alien yang lolos melewati batas kiri akan mengurangi HP base secara proporsional.
- **Splitter Meteors**: Meteor besar yang berhasil dihancurkan akan terbelah menjadi 2 meteor kecil yang melesat maju.
- **Musuh Tambahan (Kroco & Boss)**:
  - 👾 **Kroco Alien Drone**: Drone pengintai yang bergerak lincah dan menembakkan proyektil laser ke arah pesawat.
  - 👑 **Cyber Dreadnought Boss**: Muncul setiap beberapa wave dengan sirine peringatan, bar HP tebal, tembakan laser 3 arah, dan kemampuan memanggil bala bantuan.
- **Kontrol 4 Arah**: Pesawat kini dapat bermanuver bebas: Atas, Bawah, Maju (Kanan), dan Mundur (Kiri).
- **Hangar & Upgrade Permanen**: Gunakan **⚡ Energy** yang didapat setelah setiap pertandingan untuk membeli upgrade permanen di Main Menu:
  - 🛸 **Wingman Drones**: Drone tempur mini yang terbang mendampingi pesawat utama dan ikut menembak.
  - 🛡️ **Base Shield HP**: Meningkatkan HP markas (10k -> 13k -> 17k -> 22k).
  - 💥 **Bullet Damage**: Meningkatkan damage proyektil (+30%, +70%, +120%).
  - ⚡ **Gatling Overclock**: Mempercepat kecepatan serang (firerate).
  - 🚀 **Engine Thrusters**: Meningkatkan kelincahan dan kecepatan gerak pesawat.
- **Sistem Achievement (Misi)**: Selesaikan berbagai tantangan in-game untuk mengklaim hadiah bonus ⚡ Energy.
- **Mode Multiplayer Co-Op (Room Code)**:
  - Buat room dan bagikan kode 4 karakter kepada teman.
  - Pemain lain cukup memasukkan kode room untuk bergabung bertarung bersama secara real-time.
- **Glowing Skill Orbs**: Bola energi bulat bercahaya muncul mengambang di area tengah pertempuran secara berkala (3x Shot, Damage Boost, Speed, Rapid Fire, Shield).
- **Leaderboard Online (Supabase)**: Simpan skor dan callsign pilot Anda ke cloud leaderboard global secara real-time.
- **Efek Suara Prosedural**: Sintesis Web Audio API retro untuk tembakan, ledakan, sirine boss, dan tabrakan.

---

## 🎮 Kontrol Permainan

| Tombol | Aksi |
|---|---|
| **W / A / S / D** atau **Panah** | Gerak 4 Arah (Atas, Bawah, Mundur, Maju) |
| **SPACE** *(tahan)* | Tembak Otomatis (Auto-Fire) |
| **H** | Buka Hangar Upgrades |
| **M** | Buka Menu Multiplayer |
| **T** | Buka Daftar Achievement |
| **L** | Buka Leaderboard |
| **P / ESC** | Pause Permainan |

---

## 📄 Lisensi
MIT License
