import Image from "next/image";
import type { Foto } from "@/lib/schemas";
import { IkonMasjid } from "./ikon";

export type LogoTampil = Pick<Foto, "url" | "lebar" | "tinggi">;

/** Logo unggahan admin (di atas kotak putih), atau ikon masjid bawaan bila belum ada. */
export function LogoMasjid({
  logo,
  nama,
  className = "size-9",
  ikonClassName = "size-5",
  sizes = "72px",
  priority = false,
}: {
  logo: LogoTampil | null;
  /** Nama masjid untuk teks alternatif logo. */
  nama?: string;
  className?: string;
  ikonClassName?: string;
  sizes?: string;
  priority?: boolean;
}) {
  if (!logo) {
    return (
      <span className={`grid shrink-0 place-items-center rounded-full bg-emas-400 text-hijau-950 ${className}`}>
        <IkonMasjid className={ikonClassName} />
      </span>
    );
  }
  return (
    <span className={`relative block shrink-0 overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-black/5 ${className}`}>
      <Image
        src={logo.url}
        alt={nama ? `Logo ${nama}` : "Logo masjid"}
        fill
        sizes={sizes}
        priority={priority}
        className="object-contain p-[6%]"
      />
    </span>
  );
}
