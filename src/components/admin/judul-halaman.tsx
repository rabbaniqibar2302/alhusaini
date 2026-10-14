import type { ReactNode } from "react";

export function JudulHalaman({ judul, deskripsi }: { judul: string; deskripsi?: ReactNode }) {
  return (
    <div className="mb-5">
      <h1 className="text-xl font-bold text-hijau-900 sm:text-2xl">{judul}</h1>
      {deskripsi && <p className="mt-1 text-sm text-stone-600">{deskripsi}</p>}
    </div>
  );
}
