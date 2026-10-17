/** Bentuk balasan seragam semua server action admin (dipakai useActionState). */
export type HasilAksi = {
  ok: boolean;
  pesan: string;
  galat?: Record<string, string[] | undefined>;
  /** Penanda unik tiap balasan supaya form bisa bereaksi (mis. reset setelah sukses). */
  kunci?: number;
  /** ID data yang baru dibuat (mis. kegiatan, supaya fotonya bisa langsung diunggah). */
  idBaru?: string;
};

export const HASIL_AWAL: HasilAksi = { ok: false, pesan: "" };
