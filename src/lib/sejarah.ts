/** Narasi dipecah per paragraf (dipisah baris kosong). */
export function paragrafSejarah(narasi: string): string[] {
  return narasi
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Beberapa paragraf awal (sekitar `maks` karakter) untuk halaman depan. */
export function cuplikanSejarah(narasi: string, maks = 650): { paragraf: string[]; terpotong: boolean } {
  const semua = paragrafSejarah(narasi);
  const hasil: string[] = [];
  let panjang = 0;
  for (const p of semua) {
    if (hasil.length > 0 && panjang + p.length > maks) break;
    if (p.length > maks) {
      const potong = p.slice(0, maks);
      const batas = Math.max(potong.lastIndexOf(" "), Math.floor(maks * 0.6));
      hasil.push(`${potong.slice(0, batas).trimEnd()}…`);
      return { paragraf: hasil, terpotong: true };
    }
    hasil.push(p);
    panjang += p.length;
  }
  return { paragraf: hasil, terpotong: hasil.length < semua.length };
}
