# Website Masjid Al Husaini

Website resmi **Masjid Al Husaini**, Jl. Mardani Raya, Gang S No. 2, Johar Baru, Jakarta Pusat.
Dibangun dengan Next.js (App Router, TypeScript) dan Tailwind CSS, siap deploy ke Vercel.
Tampilan berbahasa Indonesia, mobile-first, dengan nuansa hijau tua, putih, dan emas.

## Fitur

**Halaman depan (publik)**

- Header dan footer memakai logo masjid yang diunggah admin (atau ikon bawaan).
- Hero berisi foto masjid (atau ilustrasi bawaan), nama, alamat, dan tombol petunjuk arah.
- Jadwal sholat hari ini (Imsak, Subuh, Terbit, Dzuhur, Ashar, Maghrib, Isya) dari data Kemenag
  melalui API myQuran untuk wilayah Jakarta Pusat. Sholat berikutnya disorot, lengkap dengan hitung mundur.
- Pengumuman (yang ditandai admin untuk website).
- Hitung mundur (hari, jam, menit, detik) menuju 1 Ramadhan, 1 Syawwal, dan 10 Dzulhijjah.
- Jadwal Khotib Jumat, Pengajian Rabu, Kuliah Subuh, dan Pengajian Kaum Ibu. Setiap kajian bisa dijadwalkan
  pada **tanggal tertentu** atau **rutin setiap pekan**, dengan pengisi ustadz maupun ustadzah.
- Kegiatan masjid: kartu kegiatan terbaru (foto, tanggal, keterangan) dan halaman `/kegiatan` berisi semua kegiatan.
- Sejarah masjid: cuplikan di halaman depan dan halaman `/sejarah` berisi narasi lengkap beserta foto.
- Legalitas: kartu bukti registrasi Kemenag (SIMAS) dan DMI beserta nomornya. Foto bisa diperbesar.
- Galeri kegiatan ambulans masjid: grid foto, klik untuk memperbesar, geser untuk berpindah foto.
- Footer berisi alamat, kontak, dan tautan Google Maps.

**Layar TV masjid (`/tv`)** — lihat [Layar TV masjid](#layar-tv-masjid).

**Panel admin (`/admin`)**

- Hanya ada satu akun admin dan tidak ada halaman pendaftaran.
- Tambah, edit, dan hapus keempat jadwal. Ada juga tombol untuk membersihkan jadwal yang sudah lewat.
- Pengumuman dengan periode tampil (mulai/sampai), opsional tampil juga di website.
- Kegiatan masjid: nama, tanggal, keterangan, dan hingga 12 foto per kegiatan (bisa pilih beberapa foto sekaligus).
- Sejarah masjid: narasi beberapa paragraf dan hingga 30 foto berketerangan yang urutannya bisa diatur.
- Menetapkan tanggal 1 Ramadhan, 1 Syawwal, dan 10 Dzulhijjah sesuai sidang isbat, plus koreksi kalender Hijriah ±2 hari.
- Upload/ganti logo masjid, foto masjid, foto bukti registrasi Kemenag & DMI, dan foto kegiatan ambulans.
- Pengaturan layar TV: jeda iqomah per waktu sholat, lama layar sholat/Jumat, lama tiap tampilan, serta
  suara adzan (upload file, pilih waktu sholat yang berbunyi, dan volume).
- Mengubah kontak (telepon, WhatsApp, email, Instagram).
- Perubahan langsung tampil di halaman depan dan layar TV, karena cache halaman diperbarui setiap kali admin menyimpan.

## Teknologi

| Bagian | Pustaka |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components), React 19, TypeScript |
| Tampilan | Tailwind CSS 4, font Plus Jakarta Sans & Amiri (`next/font`) |
| Data teks | Upstash Redis (`@upstash/redis`): JSON per kunci, tanpa SQL |
| Foto | Vercel Blob (`@vercel/blob`), diproses dengan `sharp` |
| Suara adzan | Vercel Blob, diunggah langsung dari browser (*client upload*) |
| Keamanan | `jose` (JWT), `bcryptjs`, `@upstash/ratelimit`, `otpauth` (TOTP), `zod` |
| Jadwal sholat | API myQuran (Kemenag), cadangan perhitungan lokal dengan `adhan` |

---

## Deploy ke Vercel (langkah demi langkah)

1. **Import proyek.** Di [vercel.com](https://vercel.com) pilih *Add New → Project*, lalu import repositori ini.
   Framework Next.js terdeteksi otomatis.
2. **Hubungkan Upstash Redis.** Buka *Project → Storage → Create Database → Upstash for Redis*.
   Pilih region **Singapore (ap-southeast-1)**, lalu hubungkan ke proyek.
   Variabel `KV_REST_API_URL` dan `KV_REST_API_TOKEN` akan terisi otomatis.
3. **Hubungkan Vercel Blob.** Buka *Project → Storage → Create → Blob*, pilih akses **Public**, lalu hubungkan ke proyek.
   Variabel `BLOB_READ_WRITE_TOKEN` akan terisi otomatis.
4. **Buat kredensial admin** di komputer yang memiliki Node.js 20.9 atau lebih baru:
   ```bash
   npm install
   npm run hash-password      # ketik password admin (min. 12 karakter) → keluar hash bcrypt
   npm run generate-secret    # → SESSION_SECRET acak
   npm run totp-setup         # opsional: 2FA Google Authenticator (pindai QR di terminal)
   ```
   Paket `bcrypt` tidak perlu dipasang terpisah: proyek ini memakai `bcryptjs` (JavaScript murni) yang ikut
   terpasang lewat `npm install`. Tidak punya Node.js? Buka repositori ini di GitHub → *Code → Codespaces →
   Create codespace*, lalu jalankan perintah di atas di terminal yang muncul di browser.
5. **Isi Environment Variables** di *Project → Settings → Environment Variables* (Production):

   | Nama | Isi |
   | --- | --- |
   | `ADMIN_USERNAME` | username admin, mis. `admin` |
   | `ADMIN_PASSWORD_HASH` | hash dari `npm run hash-password`, **disalin apa adanya** (tanpa `\`) |
   | `SESSION_SECRET` | hasil `npm run generate-secret` (min. 32 karakter) |
   | `ADMIN_TOTP_SECRET` | opsional, hasil `npm run totp-setup` |

6. **Deploy** (atau *Redeploy* bila proyek sudah ter-deploy). Setiap perubahan environment variable baru berlaku setelah redeploy.
7. Buka `https://domain-anda/admin` dan login.

> `vercel.json` menempatkan fungsi server di region Singapura (`sin1`), yang terdekat dengan Jakarta.
> Region Upstash sebaiknya juga Singapura agar akses database cepat.

## Pengembangan lokal

```bash
npm install
cp .env.example .env.local    # isi nilainya (atau: vercel env pull .env.local)
npm run dev                   # http://localhost:3000
```

**Penting untuk `.env.local`:** Next.js memperlakukan tanda `$` sebagai variabel, jadi hash bcrypt harus ditulis
dengan `\$`, misalnya `ADMIN_PASSWORD_HASH=\$2b\$12\$...`. Perintah `npm run hash-password` menampilkan
kedua format: format asli untuk Vercel dan format ber-escape untuk `.env.local`.

Tanpa Redis pun halaman depan tetap tampil memakai data contoh. Login dan penyimpanan baru bisa dipakai setelah Redis dan kredensial diisi.

## Data contoh (seed)

- Selama sebuah kunci di Redis belum pernah diisi, halaman otomatis memakai **data contoh** yang diberi
  keterangan "Data contoh". Website tidak kosong saat pertama deploy, dan pengunjung tidak mengira data contoh sebagai data resmi.
- `npm run seed` menulis data contoh ke Redis, khusus untuk kunci yang masih kosong.
  `npm run seed -- --paksa` menimpa semuanya. Script ini membaca kredensial dari `.env.local`.
- Nomor registrasi Kemenag/DMI sengaja dikosongkan karena merupakan data resmi. Isi lewat menu *Legalitas*.

Kunci Redis yang dipakai (nilai disimpan sebagai JSON):

| Kunci | Isi |
| --- | --- |
| `jadwal:khotib` | jadwal khotib & imam Jumat |
| `jadwal:pengajian-rabu` | pengajian Rabu |
| `jadwal:kuliah-subuh` | kuliah Subuh |
| `jadwal:pengajian-ibu` | pengajian kaum ibu |
| `konten:pengumuman` | pengumuman (layar TV & website) |
| `konten:kegiatan` | kegiatan masjid beserta fotonya |
| `konten:sejarah` | narasi & foto sejarah masjid |
| `setting:countdown` | koreksi kalender Hijriah & tanggal penetapan sidang isbat |
| `setting:kontak` | telepon, WhatsApp, email, Instagram |
| `setting:legalitas` | nomor & foto registrasi Kemenag dan DMI |
| `setting:tv` | pengaturan layar TV (iqomah, durasi) |
| `media:logo` | logo masjid |
| `media:hero` | foto masjid |
| `media:galeri-ambulans` | galeri kegiatan ambulans |
| `media:adzan` | file suara adzan (umum & Subuh) |

Kunci teknis: `sesi:*` (sesi admin aktif), `ratelimit:login:*`, `totp:terpakai:*`, `cache:jadwal-sholat:*`,
dan `cadangan:*` (salinan otomatis bila data lama di Redis tidak lolos validasi saat akan ditimpa, disimpan 180 hari).

Jadwal kajian yang tersimpan dengan format lama (sebelum ada pilihan tanggal/rutin) tetap terbaca dan otomatis
dianggap **rutin setiap pekan**; formatnya diperbarui saat jadwal itu disimpan ulang dari panel admin.

## Keamanan

| Ketentuan | Implementasi |
| --- | --- |
| Kredensial di env | `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` (bcrypt cost 12). Script `npm run hash-password` menerima input tersembunyi. Username dibandingkan dengan waktu konstan, dan bcrypt tetap dijalankan walau username salah. |
| Sesi | JWT HS256 (`jose`) ditandatangani `SESSION_SECRET`, cookie `__Host-` dengan httpOnly, Secure, SameSite=Strict, berlaku 8 jam. Sesi juga dicatat di Redis sehingga logout benar-benar mencabutnya. Sesi dirotasi saat login. Mengganti username/hash/secret otomatis membatalkan semua sesi lama. |
| Rate limit | `@upstash/ratelimit`: 5 percobaan per 15 menit per IP, lalu terkunci sementara. Ada pengaman tambahan 30 percobaan per 15 menit untuk seluruh IP. Bila Redis tidak tersedia, login ditolak (*fail closed*). Pesan error dibuat umum. |
| 2FA (opsional) | TOTP (Google Authenticator) via `ADMIN_TOTP_SECRET`, dengan proteksi agar kode yang sama tidak bisa dipakai ulang. |
| Proteksi rute | `src/proxy.ts` (nama baru *middleware* di Next.js 16) menjaga seluruh `/admin`, halaman maupun server action, dengan memeriksa JWT dan sesi aktif. Pemeriksaan ulang dilakukan **di server** pada setiap halaman admin dan setiap aksi tulis (`jalankanAksiAdmin`). |
| Validasi | Semua input divalidasi `zod`: panjang maksimal, format tanggal/jam, karakter kontrol ditolak. Data dari Redis juga divalidasi ulang. Output di-escape React, dan aturan ESLint `react/no-danger` melarang `dangerouslySetInnerHTML`. |
| Upload foto | Hanya JPG/PNG/WEBP, maks. 5 MB. Tipe asli dicek dari *magic bytes*. Gambar di-decode ulang dengan `sharp`, diputar sesuai EXIF, diperkecil maks. 2000 px, **metadata/GPS dibuang**, disimpan sebagai WEBP dengan nama UUID acak. |
| Upload suara adzan | Hanya MP3/M4A/OGG, maks. 15 MB. Browser meminta token unggah ke `/admin/unggah-audio` (wajib sesi admin + `Origin` sama); token hanya berlaku 10 menit untuk satu nama `masjid/audio/<UUID acak>.<format>`, dengan tipe konten dan ukuran dibatasi, tanpa menimpa file lain. Setelah terunggah, server membaca ulang awal file dari Blob, mencocokkan *magic bytes* dengan formatnya, dan memeriksa ukurannya. File yang tidak lolos langsung dihapus. |
| CSRF | Header `Origin` wajib sama persis dengan situs untuk setiap request pengubah data, dicek di proxy **dan** di setiap server action/route. Halaman publik bersifat baca-saja (POST di luar `/admin` ditolak 405). |
| Security headers | Diatur di `next.config.ts`: CSP, HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, COOP. |
| Token hanya di server | Modul yang memakai Redis, Blob, atau secret ditandai `import "server-only"`. Tidak ada variabel `NEXT_PUBLIC_*` yang berisi rahasia. |
| Logout | Tombol *Keluar* (POST `/admin/logout`) menghapus sesi di Redis dan cookie di browser. |

Catatan teknis:

- **CSP** memakai `script-src 'self' 'unsafe-inline'` karena halaman disajikan statis dari cache (Partial Prerendering).
  Nonce tidak bisa dipakai pada halaman statis, sementara Next.js membutuhkan skrip hidrasi inline.
  Perlindungan XSS bertumpu pada escaping React, larangan `dangerouslySetInnerHTML`, dan validasi zod.
- **Batas upload Vercel**: body request fungsi Vercel maksimal 4,5 MB. Foto berukuran 4–5 MB otomatis
  diperkecil di browser sebelum dikirim, dan server tetap menegakkan batas 5 MB beserta pengecekan magic bytes.
- **Suara adzan** (bisa lebih dari 4,5 MB) tidak lewat fungsi Vercel, melainkan diunggah langsung dari browser ke
  Vercel Blob. Karena itu CSP `connect-src` mengizinkan `https://vercel.com` (API unggah Blob), dan `media-src`
  mengizinkan domain `*.public.blob.vercel-storage.com`.
- **IP untuk rate limit** diambil dari header `x-real-ip`/`x-forwarded-for` yang ditetapkan Vercel. Bila di-host
  di luar Vercel, pastikan reverse proxy menimpa header tersebut.

## Jadwal sholat

- Sumber data: API myQuran (data Bimas Islam Kemenag RI). Yang dicoba pertama v3, lalu v2.
  Kota dicari otomatis ("Jakarta Pusat", lalu "Jakarta"). ID kota v3 bisa dipaksa lewat `MYQURAN_KOTA_ID`.
- Cache per hari: hasil API disimpan di Redis per tanggal selama 3 hari, sehingga API hanya dipanggil
  sekali per tanggal. Bila API tidak dapat dihubungi, ditampilkan **perkiraan** dari perhitungan lokal
  (metode Kemenag: Subuh 20°, Isya 18°) dengan keterangan, lalu API dicoba lagi setelah 15 menit.
- Halaman depan dibuat ulang paling lama tiap 10 menit (maks. 1 jam). Sholat berikutnya dan hitung mundur
  dihitung di browser dalam WIB, sehingga tetap akurat walau halaman berasal dari cache.

## Hitung mundur hari besar

- Tanggal otomatis berasal dari kalender Hijriah Umm al-Qura (bawaan Node.js/Intl).
- Hasil sidang isbat dimasukkan lewat menu *Hitung Mundur → Tetapkan tanggal resmi* per tahun Hijriah.
  Tanggal penetapan dibatasi maks. 5 hari dari perkiraan, untuk mencegah salah pilih tahun.
- Kalender Indonesia sering 1 hari lebih lambat dari Umm al-Qura. Dalam kasus itu, atur
  *Koreksi kalender Hijriah* ke +1 agar tanggal Hijriah harian dan perkiraan otomatis ikut bergeser.
- Pada harinya ditampilkan ucapan, dan keesokan harinya hitung mundur otomatis pindah ke tahun Hijriah berikutnya.

## Layar TV masjid

Halaman `/tv` dirancang untuk TV di dalam masjid (16:9, Full HD, dan otomatis menyesuaikan ukuran layar):

- logo, nama, dan alamat masjid; tanggal Masehi & Hijriah; jam analog dan digital (WIB);
- jadwal sholat dengan sorotan waktu berikutnya dan hitung mundur menuju adzan
  (10 menit terakhir berkedip, 5 menit terakhir tampil besar);
- setelah adzan: **hitung mundur iqomah**, lalu layar diredupkan selama **sholat berlangsung**;
  hari Jumat: layar **khutbah Jumat** sejak masuk waktu Dzuhur;
- tampilan bergantian: foto masjid, pengumuman, jadwal kajian 7 hari ke depan, khotib Jumat,
  hitung mundur hari besar, dan foto kegiatan terbaru;
- teks berjalan berisi semua pengumuman yang aktif.

Cara memasang:

1. Pakai perangkat dengan browser Chrome/Edge versi terbaru: Android TV / TV box, mini PC, atau laptop yang
   disambungkan ke TV. Browser bawaan Smart TV lama sering tidak mendukung tampilan modern.
2. Buka `https://domain-anda/tv`, lalu tekan tombol **Layar penuh** (muncul saat mouse/remote digerakkan) atau tombol F.
3. Matikan mode tidur/screensaver di perangkat tersebut. Halaman juga meminta agar layar tetap menyala (bila didukung).

4. Klik layar atau tekan tombol OK pada remote (Enter pada keyboard) **sekali** supaya suara adzan boleh berbunyi
   (lihat [Suara adzan](#suara-adzan)).

Layar TV tidak perlu login dan tidak bisa mengubah data. Datanya diperbarui sendiri tiap 5 menit, jam disamakan
dengan jam server (bila jam TV box meleset), dan bila internet putus jadwal sholat tetap dihitung di perangkat.
Data contoh jadwal (khotib & kajian) tidak ditampilkan di TV. Jeda iqomah dan durasi lainnya diatur di
*Panel admin → Layar TV*.

### Suara adzan

- Unggah file adzan di *Panel admin → Layar TV → Suara adzan*: MP3 (disarankan, didukung semua perangkat),
  M4A, atau OGG, maks. 15 MB. File **Suara adzan Subuh** bersifat opsional; bila kosong (atau tidak bisa
  diputar di perangkat TV), Subuh memakai file adzan biasa.
- Admin memilih waktu sholat yang adzannya diputar (bawaan: Subuh, Dzuhur, Ashar, Maghrib, Isya) dan volumenya.
  **Jumat** bawaan *tidak* berbunyi, karena adzan Jumat dikumandangkan saat khotib naik mimbar. Matikan juga
  waktu yang adzannya dikumandangkan langsung oleh muadzin supaya tidak bersamaan.
- Adzan mulai tepat saat masuk waktu (bila layar baru dibuka/terlambat, masih diputar hingga 2 menit sesudahnya),
  ditandai tulisan *"Adzan … sedang berkumandang"*, dan otomatis berhenti saat layar sholat dimulai.
- **Izin suara dari browser.** Browser tidak mengizinkan halaman membunyikan suara sebelum ada klik/tombol dari
  pengguna. Selama belum diizinkan, layar TV menampilkan pengingat kuning; cukup klik layar atau tekan tombol OK
  di remote sekali, dan izin berlaku sampai halaman ditutup/dimuat ulang. Karena itu layar TV tidak memuat ulang
  dirinya sendiri (data diperbarui tanpa reload). Ulangi setiap kali TV box dinyalakan ulang.
- Supaya tidak perlu klik sama sekali: pakai browser kios seperti **Fully Kiosk Browser** (Android) dengan opsi
  autoplay diaktifkan, atau jalankan Chrome di mini PC dengan
  `chrome --kiosk --autoplay-policy=no-user-gesture-required https://domain-anda/tv`.
- Tombol **Tes suara adzan** (muncul di pojok kanan atas saat mouse/remote digerakkan) untuk memeriksa volume.

## Mengubah identitas masjid

Nama, nama Arab, alamat, dan koordinat masjid (untuk perhitungan cadangan jadwal sholat) ada di
`src/lib/site.ts`. Logo, kontak, dan legalitas diubah lewat panel admin.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | server pengembangan |
| `npm run build` / `npm start` | build & jalankan versi produksi |
| `npm run lint` / `npm run typecheck` / `npm test` | ESLint, TypeScript, dan unit test logika (kalender, hitung mundur, parser jadwal sholat, jadwal kajian & migrasi data lama, fase layar TV, suara adzan, validasi) |
| `npm run hash-password` | membuat `ADMIN_PASSWORD_HASH` |
| `npm run generate-secret` | membuat `SESSION_SECRET` |
| `npm run totp-setup` | membuat `ADMIN_TOTP_SECRET` + QR untuk Google Authenticator |
| `npm run seed` | mengisi Redis dengan data contoh |

## Struktur folder

```
src/
  app/                 halaman (beranda, kegiatan, sejarah, tv, admin, login, logout)
  components/publik/   komponen halaman publik
  components/tv/       layar TV masjid
  components/admin/    form & komponen panel admin
  lib/                 kode bersama (skema zod, waktu WIB, kalender Hijriah, hitung mundur, kajian, fase layar TV)
  server/              kode khusus server (Redis, auth, rate limit, upload, jadwal sholat, server action)
  proxy.ts             proteksi /admin + CSRF (pengganti middleware di Next.js 16)
scripts/               hash password, secret, TOTP, seed
tests/                 unit test (node:test)
```

## Pemecahan masalah

- **"Login belum dapat digunakan… konfigurasi server belum lengkap"**: periksa `ADMIN_USERNAME`,
  `ADMIN_PASSWORD_HASH`, `SESSION_SECRET` (min. 32 karakter), dan koneksi Upstash, lalu redeploy.
- **Password benar tetapi ditolak saat lokal**: pastikan `$` pada hash di `.env.local` ditulis `\$`.
- **"Terlalu banyak percobaan login"**: tunggu sesuai waktu yang tertera (maks. 15 menit).
- **Lupa password**: buat hash baru dengan `npm run hash-password`, ganti `ADMIN_PASSWORD_HASH` di Vercel, lalu redeploy.
- **Ponsel 2FA hilang**: kosongkan atau ganti `ADMIN_TOTP_SECRET` (`npm run totp-setup`), lalu redeploy.
- **Upload gagal "Penyimpanan foto belum dikonfigurasi"**: hubungkan Blob store ke proyek.
  Pastikan aksesnya *Public*, karena foto ditampilkan ke publik.
- **Layar TV tampil kecil/terpotong**: pastikan zoom browser 100% dan gunakan mode layar penuh.
  Pada layar yang rasionya bukan 16:9, tampilan diberi pinggiran hitam supaya tidak terpotong.
- **Layar TV belum menampilkan perubahan**: tunggu hingga 5 menit, atau muat ulang halaman `/tv`.
- **Adzan tidak berbunyi**: pastikan pengingat kuning "Suara adzan belum aktif" tidak tampil (bila tampil, klik
  layar sekali), waktu sholat tersebut dicentang di pengaturan, dan volume TV tidak dibisukan. Coba tombol
  *Tes suara adzan*. Bila file M4A tidak berbunyi di TV box tertentu, unggah ulang dalam format MP3.
- **Upload suara adzan gagal**: pastikan Blob store terhubung dan aksesnya *Public*. Bila memakai jaringan kantor
  yang memblokir `vercel.com`, coba jaringan lain.
