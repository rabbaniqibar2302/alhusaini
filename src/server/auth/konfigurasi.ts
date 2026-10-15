import "server-only";
import { rahasiaSesiValid } from "./token";

/**
 * Pemeriksaan ringan apakah kredensial admin sudah terpasang di environment
 * (tanpa dependensi berat, sehingga juga dipakai proxy).
 */

const POLA_BCRYPT = /^\$2[aby]\$\d{2}\$[./A-Za-z0-9]{53}$/;

export function hashPasswordAdmin(): string | null {
  // Toleran terhadap "\$" yang ikut tersalin dari format .env.local.
  const hash = process.env.ADMIN_PASSWORD_HASH?.trim().replace(/\\\$/g, "$");
  if (!hash || !POLA_BCRYPT.test(hash)) return null;
  return hash;
}

export function kredensialTerkonfigurasi(): boolean {
  return Boolean(process.env.ADMIN_USERNAME?.trim()) && hashPasswordAdmin() !== null;
}

/** Username, hash password, dan SESSION_SECRET sudah terpasang dengan benar. */
export function konfigurasiAdminLengkap(): boolean {
  return kredensialTerkonfigurasi() && rahasiaSesiValid();
}
