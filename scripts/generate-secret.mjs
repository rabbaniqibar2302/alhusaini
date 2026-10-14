#!/usr/bin/env node
// Membuat SESSION_SECRET acak (64 karakter, 384 bit).
import { randomBytes } from "node:crypto";

const secret = randomBytes(48).toString("base64url");
console.log(`SESSION_SECRET=${secret}

Salin ke Vercel → Settings → Environment Variables (atau .env.local).
Mengganti secret ini otomatis mengeluarkan semua sesi admin yang aktif.`);
