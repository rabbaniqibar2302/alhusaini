"use client";

import { startTransition, useActionState, useRef, type FormEvent } from "react";
import { HASIL_AWAL, type HasilAksi } from "@/lib/hasil-aksi";

type Aksi = (sebelumnya: HasilAksi, formData: FormData) => Promise<HasilAksi>;

/**
 * Menjalankan server action dari form tanpa reset otomatis React, sehingga
 * isian (termasuk file yang dipilih) tetap ada saat validasi gagal dan baru
 * dikosongkan setelah berhasil.
 */
export function useFormAksi(
  aksi: Aksi,
  opsi: {
    resetSaatSukses?: boolean;
    konfirmasi?: string;
    onSelesai?: (hasil: HasilAksi, form: HTMLFormElement | null) => void;
  } = {},
) {
  // Form yang terakhir dikirim; hanya dibaca di dalam aksi, bukan saat render.
  const formTerakhir = useRef<HTMLFormElement | null>(null);
  const [hasil, jalankan, pending] = useActionState(async (sebelumnya: HasilAksi, formData: FormData) => {
    const h = await aksi(sebelumnya, formData);
    const form = formTerakhir.current;
    if (h.ok && opsi.resetSaatSukses !== false) form?.reset();
    opsi.onSelesai?.(h, form);
    return h;
  }, HASIL_AWAL);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (pending) return;
    if (opsi.konfirmasi && !window.confirm(opsi.konfirmasi)) return;
    formTerakhir.current = e.currentTarget;
    // Sertakan name/value tombol yang ditekan (mis. tombol geser kiri/kanan).
    const formData = new FormData(e.currentTarget, (e.nativeEvent as SubmitEvent).submitter);
    startTransition(() => jalankan(formData));
  };

  return { hasil, pending, onSubmit };
}
