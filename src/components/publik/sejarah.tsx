import type { FotoSejarah } from "@/lib/schemas";
import { SITE } from "@/lib/site";
import type { ItemFoto } from "./penampil-foto";

export { cuplikanSejarah, paragrafSejarah } from "@/lib/sejarah";

export function fotoSejarahTampil(foto: FotoSejarah[]): ItemFoto[] {
  return foto.map((f, i) => ({
    id: f.id,
    url: f.url,
    lebar: f.lebar,
    tinggi: f.tinggi,
    alt: f.keterangan || `Foto sejarah ${SITE.nama} ${i + 1}`,
    keterangan: f.keterangan,
  }));
}

export function NarasiSejarah({ paragraf, className = "" }: { paragraf: string[]; className?: string }) {
  return (
    <div className={`space-y-4 leading-relaxed text-stone-700 ${className}`}>
      {paragraf.map((p, i) => (
        // Baris baru tunggal di dalam paragraf tetap dipertahankan.
        <p key={i} className="whitespace-pre-line">
          {p}
        </p>
      ))}
    </div>
  );
}
