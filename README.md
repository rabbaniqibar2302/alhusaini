# Website Masjid Al Husaini

Website resmi **Masjid Al Husaini**, Jl. Mardani Raya, Gang S No. 2, Johar Baru, Jakarta Pusat.
Dibangun dengan Next.js (App Router, TypeScript) dan Tailwind CSS, siap deploy ke Vercel.
Tampilan berbahasa Indonesia, mobile-first, dengan nuansa hijau tua, putih, dan emas.

## Fitur

**Halaman depan (publik)**

- Hero berisi foto masjid (atau ilustrasi bawaan), nama, alamat, dan tombol petunjuk arah.
- Jadwal sholat hari ini (Imsak, Subuh, Terbit, Dzuhur, Ashar, Maghrib, Isya) dari data Kemenag
  melalui API myQuran untuk wilayah Jakarta Pusat. Sholat berikutnya disorot, lengkap dengan hitung mundur.
- Hitung mundur (hari, jam, menit, detik) menuju 1 Ramadhan, 1 Syawwal, dan 10 Dzulhijjah.
- Jadwal Khotib Jumat, Pengajian Rabu, Kuliah Subuh, dan Pengajian Kaum Ibu.
- Legalitas: kartu bukti registrasi Kemenag (SIMAS) dan DMI beserta nomornya. Foto bisa diperbesar.
- Galeri kegiatan ambulans masjid: grid foto, klik untuk memperbesar, geser untuk berpindah foto.
- Footer berisi alamat, kontak, dan tautan Google Maps.

**Panel admin (`/admin`)**

- Hanya ada satu akun admin dan tidak ada halaman pendaftaran. Kredensialnya dibuat lewat halaman
  `/admin/setup` (di browser, tanpa install apa pun) dan disimpan sebagai Environment Variables di Vercel.
- Tambah, edit, dan hapus keempat jadwal. Ada juga tombol untuk membersihkan jadwal yang sudah lewat.
- Menetapkan tanggal 1 Ramadhan, 1 Syawwal, dan 10 Dzulhijjah sesuai sidang isbat, plus koreksi kalender Hijriah ±2 hari.
- Upload/ganti foto masjid, foto bukti registrasi Kemenag & DMI, dan foto kegiatan ambulans.
- Mengubah kontak (telepon, WhatsApp, email, Instagram).
- Perubahan langsung tampil di halaman depan, karena cache halaman diperbarui setiap kali admin menyimpan.

## Teknologi

| Bagian | Pustaka |
| --- | --- |
| Framework | Next.js 16 (App Router, Cache Components), React 19, TypeScript |
| Tampilan | Tailwind CSS 4, font Plus Jakarta Sans & Amiri (`next/font`) |
| Data teks | Upstash Redis (`@upstash/redis`): JSON per kunci, tanpa SQL |
| Foto | Vercel Blob (`@vercel/blob`), diproses dengan `sharp` |
| Keamanan | `jose` (JWT), `bcryptjs`, `@upstash/ratelimit`, `otpauth` (TOTP), `zod` |
| Jadwal sholat | API myQuran (Kemenag), cadangan perhitungan lokal dengan `adhan` |

---

## Deploy ke Vercel (langkah demi langkah)

Tidak perlu meng-install apa pun di komputer Anda.

1. **Import proyek.** Di [vercel.com](https://vercel.com) pilih *Add New → Project*, lalu import repositori ini.
   Framework Next.js terdeteksi otomatis.
2. **Hubungkan Upstash Redis.** Buka *Project → Storage → Create Database → Upstash for Redis*.
   Pilih region **Singapore (ap-southeast-1)**, lalu hubungkan ke proyek.
   Variabel `KV_REST_API_URL` dan `KV_REST_API_TOKEN` akan terisi otomatis.
3. **Hubungkan Vercel Blob.** Buka *Project → Storage → Create → Blob*, pilih akses **Public**, lalu hubungkan ke proyek.
   Variabel `BLOB_READ_WRITE_TOKEN` akan terisi otomatis.
4. **Deploy.** Website langsung tampil dengan data contoh. Login admin memang belum bisa dipakai pada tahap ini.
5. **Buat kredensial admin di website Anda sendiri** dengan membuka `https://domain-anda/admin/setup`:
   - isi username dan password (min. 12 karakter), lalu centang verifikasi dua langkah bila ingin;
   - klik **Buat kredensial**. Hash bcrypt, `SESSION_SECRET`, dan kunci 2FA dibuat **di browser Anda**,
     jadi password tidak dikirim ke server dan tidak disimpan di mana pun;
   - buka *Project → Settings → Environment Variables*, klik **Salin semua** di halaman setup, lalu tempel ke kolom
     *Key* (Vercel otomatis memecahnya menjadi beberapa variabel, environment **Production**);
   - bila 2FA dicentang, pindai QR dengan Google Authenticator lalu uji kodenya di halaman yang sama.
6. **Redeploy** lewat *Deployments → ⋯ (deployment teratas) → Redeploy*. Perubahan environment variable baru berlaku setelah redeploy.
7. Buka `https://domain-anda/admin/login` dan masuk.

Halaman `/admin/setup` hanya terbuka untuk umum selama kredensial admin belum terpasang. Setelah itu,
halaman ini hanya bisa dibuka admin yang sudah login, misalnya untuk mengganti password atau mengaktifkan 2FA.
Halaman ini juga menampilkan status koneksi Upstash Redis, Vercel Blob, dan setiap variabel.

| Variabel | Isi |
| --- | --- |
| `ADMIN_USERNAME` | username admin, mis. `admin` |
| `ADMIN_PASSWORD_HASH` | hash bcrypt dari password admin (bukan password asli) |
| `SESSION_SECRET` | kunci acak min. 32 karakter |
| `ADMIN_TOTP_SECRET` | opsional, kunci 2FA Google Authenticator |

> **Alternatif lewat terminal** (Node.js 20.9+): `npm install`, lalu `npm run hash-password`,
> `npm run generate-secret`, dan `npm run totp-setup` (opsional). Paket `bcrypt` tidak perlu dipasang terpisah,
> karena proyek ini memakai `bcryptjs` (JavaScript murni) yang ikut terpasang lewat `npm install`.

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
| `jadwal:kuliah-subuh` | kuliah Subuh pekanan |
| `jadwal:pengajian-ibu` | pengajian kaum ibu |
| `setting:countdown` | koreksi kalender Hijriah & tanggal penetapan sidang isbat |
| `setting:kontak` | telepon, WhatsApp, email, Instagram |
| `setting:legalitas` | nomor & foto registrasi Kemenag dan DMI |
| `media:hero` | foto masjid |
| `media:galeri-ambulans` | galeri kegiatan ambulans |

Kunci teknis: `sesi:*` (sesi admin aktif), `ratelimit:login:*`, `totp:terpakai:*`, `cache:jadwal-sholat:*`.

## Keamanan

| Ketentuan | Implementasi |
| --- | --- |
| Kredensial di env | `ADMIN_USERNAME` + `ADMIN_PASSWORD_HASH` (bcrypt cost 12). Hash dibuat di browser lewat `/admin/setup` atau di terminal lewat `npm run hash-password`; password asli tidak pernah dikirim ke server. Halaman setup hanya publik selama kredensial belum terpasang. Username dibandingkan dengan waktu konstan, dan bcrypt tetap dijalankan walau username salah. |
| Sesi | JWT HS256 (`jose`) ditandatangani `SESSION_SECRET`, cookie `__Host-` dengan httpOnly, Secure, SameSite=Strict, berlaku 8 jam. Sesi juga dicatat di Redis sehingga logout benar-benar mencabutnya. Sesi dirotasi saat login. Mengganti username/hash/secret otomatis membatalkan semua sesi lama. |
| Rate limit | `@upstash/ratelimit`: 5 percobaan per 15 menit per IP, lalu terkunci sementara. Ada pengaman tambahan 30 percobaan per 15 menit untuk seluruh IP. Bila Redis tidak tersedia, login ditolak (*fail closed*). Pesan error dibuat umum. |
| 2FA (opsional) | TOTP (Google Authenticator) via `ADMIN_TOTP_SECRET`, dengan proteksi agar kode yang sama tidak bisa dipakai ulang. |
| Proteksi rute | `src/proxy.ts` (nama baru *middleware* di Next.js 16) menjaga seluruh `/admin`, halaman maupun server action, dengan memeriksa JWT dan sesi aktif. Pemeriksaan ulang dilakukan **di server** pada setiap halaman admin dan setiap aksi tulis (`jalankanAksiAdmin`). |
| Validasi | Semua input divalidasi `zod`: panjang maksimal, format tanggal/jam, karakter kontrol ditolak. Data dari Redis juga divalidasi ulang. Output di-escape React, dan aturan ESLint `react/no-danger` melarang `dangerouslySetInnerHTML`. |
| Upload foto | Hanya JPG/PNG/WEBP, maks. 5 MB. Tipe asli dicek dari *magic bytes*. Gambar di-decode ulang dengan `sharp`, diputar sesuai EXIF, diperkecil maks. 2000 px, **metadata/GPS dibuang**, disimpan sebagai WEBP dengan nama UUID acak. |
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

## Mengubah identitas masjid

Nama, nama Arab, alamat, dan koordinat masjid (untuk perhitungan cadangan jadwal sholat) ada di
`src/lib/site.ts`. Kontak dan legalitas diubah lewat panel admin.

## Perintah

| Perintah | Fungsi |
| --- | --- |
| `npm run dev` | server pengembangan |
| `npm run build` / `npm start` | build & jalankan versi produksi |
| `npm run lint` / `npm run typecheck` / `npm test` | ESLint, TypeScript, dan unit test logika (kalender, hitung mundur, parser jadwal sholat) |
| `npm run hash-password` | membuat `ADMIN_PASSWORD_HASH` |
| `npm run generate-secret` | membuat `SESSION_SECRET` |
| `npm run totp-setup` | membuat `ADMIN_TOTP_SECRET` + QR untuk Google Authenticator |
| `npm run seed` | mengisi Redis dengan data contoh |

## Struktur folder

```
src/
  app/                 halaman (beranda, admin, login, logout)
  components/publik/   komponen halaman depan
  components/admin/    form & komponen panel admin
  lib/                 kode bersama (skema zod, waktu WIB, kalender Hijriah, hitung mundur)
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
- **Lupa password**: hapus variabel `ADMIN_PASSWORD_HASH` di Vercel lalu redeploy. Halaman `/admin/setup`
  akan terbuka lagi untuk membuat password baru. Hanya pemilik akun Vercel yang bisa melakukan ini.
- **Ponsel 2FA hilang**: hapus variabel `ADMIN_TOTP_SECRET` di Vercel lalu redeploy, sehingga login cukup dengan password.
  Setelah itu aktifkan lagi 2FA lewat *Dasbor → Ganti password / 2FA*.
- **Hash yang ditempel ke Vercel ditolak** (status "Format tidak valid" di `/admin/setup`): pastikan disalin utuh
  tanpa tanda kutip atau spasi. Di Vercel, tanda `$` ditulis apa adanya; escape `\$` hanya diperlukan di `.env.local`.
- **Upload gagal "Penyimpanan foto belum dikonfigurasi"**: hubungkan Blob store ke proyek.
  Pastikan aksesnya *Public*, karena foto ditampilkan ke publik.
