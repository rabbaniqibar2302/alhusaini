#!/usr/bin/env node
// Membuat hash bcrypt untuk ADMIN_PASSWORD_HASH.
// Pemakaian: npm run hash-password   (password diketik tersembunyi)
import bcrypt from "bcryptjs";
import { bacaTersembunyi } from "./terminal.mjs";

const COST = 12;
const MIN = 12;

const password = await bacaTersembunyi("Password admin baru: ");
if (password.length < MIN) {
  console.error(`✗ Password minimal ${MIN} karakter. Gunakan kombinasi huruf, angka, dan simbol.`);
  process.exit(1);
}
if (bcrypt.truncates(password)) {
  console.error("✗ Password terlalu panjang untuk bcrypt (maksimal 72 byte).");
  process.exit(1);
}
if (process.stdin.isTTY) {
  const ulang = await bacaTersembunyi("Ulangi password: ");
  if (ulang !== password) {
    console.error("✗ Password tidak sama.");
    process.exit(1);
  }
}

const hash = await bcrypt.hash(password, COST);
console.log(`
Hash bcrypt (cost ${COST}) berhasil dibuat.

1) Untuk Vercel → Project → Settings → Environment Variables, isi apa adanya:
   ADMIN_PASSWORD_HASH = ${hash}

2) Untuk file .env.local (pengembangan lokal), tanda $ wajib di-escape:
   ADMIN_PASSWORD_HASH=${hash.replace(/\$/g, "\\$")}

Password asli TIDAK disimpan di mana pun. Simpan password Anda di tempat aman.
Mengganti hash otomatis mengeluarkan (logout) semua sesi admin yang aktif.`);
