#!/usr/bin/env node
// Menyiapkan 2FA (TOTP) untuk Google Authenticator / aplikasi authenticator lain.
// Pemakaian: npm run totp-setup
import * as OTPAuth from "otpauth";
import QRCode from "qrcode";
import { tanya } from "./terminal.mjs";

const secret = new OTPAuth.Secret({ size: 20 });
const totp = new OTPAuth.TOTP({
  issuer: "Masjid Al Husaini",
  label: "admin",
  algorithm: "SHA1",
  digits: 6,
  period: 30,
  secret,
});
const uri = totp.toString();

console.log("\nPindai QR berikut dengan Google Authenticator (atau aplikasi sejenis):\n");
console.log(await QRCode.toString(uri, { type: "terminal", small: true }));
console.log(`Atau masukkan kunci secara manual: ${secret.base32}\n`);

if (process.stdin.isTTY) {
  const kode = (await tanya("Ketik kode 6 digit dari aplikasi untuk menguji (Enter untuk lewati): ")).trim();
  if (kode) {
    const cocok = totp.validate({ token: kode, window: 1 }) !== null;
    console.log(cocok ? "✓ Kode cocok. Aplikasi authenticator sudah benar." : "✗ Kode tidak cocok. Periksa jam ponsel lalu coba lagi.");
  }
}

console.log(`
Lalu isi environment variable (Vercel & .env.local):
ADMIN_TOTP_SECRET=${secret.base32}

Setelah diisi, form login meminta kode 6 digit dari aplikasi.
Simpan kunci di atas di tempat aman sebagai cadangan bila ponsel hilang.`);
