/** Tautan wa.me dari nomor lokal (08xx) maupun internasional (+62/62xx). */
export function tautanWhatsApp(nomor: string, pesan?: string): string {
  let angka = nomor.replace(/\D/g, "");
  if (angka.startsWith("0")) angka = `62${angka.slice(1)}`;
  const teks = pesan ? `?text=${encodeURIComponent(pesan)}` : "";
  return `https://wa.me/${angka}${teks}`;
}
