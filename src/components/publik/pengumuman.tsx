import { IkonPengumuman } from "@/components/ikon";
import type { PengumumanItem } from "@/lib/schemas";
import { formatTanggal } from "@/lib/time";

export function DaftarPengumuman({ items }: { items: PengumumanItem[] }) {
  return (
    <ul className="grid gap-3 md:grid-cols-2">
      {items.map((x) => (
        <li key={x.id} className="flex gap-3 rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200/80">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-emas-100 text-emas-700">
            <IkonPengumuman className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="font-medium break-words text-stone-900">{x.teks}</p>
            {x.sampai && (
              <p className="mt-1 text-xs text-stone-500">Berlaku sampai {formatTanggal(x.sampai, { hari: true })}</p>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
