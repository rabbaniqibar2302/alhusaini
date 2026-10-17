import type { Infak } from "./schemas";

export const INFAK_KOSONG: Infak = { rekening: [], namaQris: "", catatan: "", tampilTv: true, qris: null };

export function adaInfak(infak: Pick<Infak, "rekening" | "qris">): boolean {
  return infak.rekening.length > 0 || infak.qris !== null;
}

/** Nomor rekening tanpa spasi/tanda hubung, untuk disalin. */
export function nomorPolos(nomor: string): string {
  return nomor.replace(/[\s-]/g, "");
}
