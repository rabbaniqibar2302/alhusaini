import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";
import { IkonCentang, IkonPeringatan } from "@/components/ikon";
import type { HasilAksi } from "@/lib/hasil-aksi";

export function Kartu({
  judul,
  deskripsi,
  children,
  aksi,
}: {
  judul?: string;
  deskripsi?: ReactNode;
  children: ReactNode;
  aksi?: ReactNode;
}) {
  return (
    <section className="rounded-2xl bg-white p-4 shadow-sm ring-1 ring-stone-200 sm:p-6">
      {(judul || aksi) && (
        <header className="mb-4 flex flex-wrap items-start justify-between gap-2">
          <div>
            {judul && <h2 className="text-lg font-bold text-hijau-900">{judul}</h2>}
            {deskripsi && <div className="mt-0.5 text-sm text-stone-600">{deskripsi}</div>}
          </div>
          {aksi}
        </header>
      )}
      {children}
    </section>
  );
}

export function PesanHasil({ hasil }: { hasil: HasilAksi }) {
  if (!hasil.pesan) return null;
  return (
    <p
      role={hasil.ok ? "status" : "alert"}
      className={`flex items-start gap-2 rounded-xl px-3 py-2.5 text-sm ring-1 ${
        hasil.ok ? "bg-hijau-50 text-hijau-800 ring-hijau-200" : "bg-red-50 text-red-800 ring-red-200"
      }`}
    >
      {hasil.ok ? (
        <IkonCentang className="mt-px size-4 shrink-0" />
      ) : (
        <IkonPeringatan className="mt-px size-4 shrink-0" />
      )}
      <span>{hasil.pesan}</span>
    </p>
  );
}

export function TombolKirim({
  pending,
  children,
  varian = "utama",
  className = "",
}: {
  pending: boolean;
  children: ReactNode;
  varian?: "utama" | "bahaya" | "sekunder";
  className?: string;
}) {
  const gaya = {
    utama: "bg-hijau-800 text-white hover:bg-hijau-700",
    bahaya: "bg-red-600 text-white hover:bg-red-700",
    sekunder: "bg-white text-hijau-900 ring-1 ring-stone-300 hover:bg-stone-50",
  }[varian];
  return (
    <button
      type="submit"
      disabled={pending}
      aria-disabled={pending}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition disabled:cursor-wait disabled:opacity-60 ${gaya} ${className}`}
    >
      {pending && (
        <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" aria-hidden="true" />
      )}
      {children}
    </button>
  );
}

const gayaInput =
  "mt-1 block w-full rounded-xl border-0 bg-white px-3 py-2.5 text-base text-stone-900 ring-1 ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-hijau-600 focus:outline-none aria-[invalid=true]:ring-red-400 sm:text-sm";

function PesanGalat({ id, galat }: { id: string; galat?: string[] }) {
  if (!galat?.length) return null;
  return (
    <p id={id} className="mt-1 text-xs text-red-700">
      {galat[0]}
    </p>
  );
}

export function Bidang({
  label,
  name,
  galat,
  petunjuk,
  id: idKustom,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; name: string; galat?: string[]; petunjuk?: string }) {
  const id = idKustom ?? `bidang-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
        {props.required && <span className="text-red-600"> *</span>}
      </label>
      <input
        id={id}
        name={name}
        aria-invalid={galat?.length ? true : undefined}
        aria-describedby={galat?.length ? `${id}-galat` : petunjuk ? `${id}-petunjuk` : undefined}
        className={gayaInput}
        {...props}
      />
      {petunjuk && !galat?.length && (
        <p id={`${id}-petunjuk`} className="mt-1 text-xs text-stone-500">
          {petunjuk}
        </p>
      )}
      <PesanGalat id={`${id}-galat`} galat={galat} />
    </div>
  );
}

export function Pilihan({
  label,
  name,
  galat,
  opsi,
  id: idKustom,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
  name: string;
  galat?: string[];
  opsi: readonly (string | { nilai: string; label: string })[];
}) {
  const id = idKustom ?? `bidang-${name}`;
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
        {props.required && <span className="text-red-600"> *</span>}
      </label>
      <select
        id={id}
        name={name}
        aria-invalid={galat?.length ? true : undefined}
        className={gayaInput}
        {...props}
      >
        {opsi.map((o) => {
          const { nilai, label: teks } = typeof o === "string" ? { nilai: o, label: o } : o;
          return (
            <option key={nilai} value={nilai}>
              {teks}
            </option>
          );
        })}
      </select>
      <PesanGalat id={`${id}-galat`} galat={galat} />
    </div>
  );
}

export function Centang({
  label,
  name,
  petunjuk,
  defaultChecked,
  id: idKustom,
}: {
  label: string;
  name: string;
  petunjuk?: string;
  defaultChecked?: boolean;
  id?: string;
}) {
  const id = idKustom ?? `bidang-${name}`;
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        name={name}
        type="checkbox"
        defaultChecked={defaultChecked}
        aria-describedby={petunjuk ? `${id}-petunjuk` : undefined}
        className="mt-0.5 size-5 shrink-0 rounded border-stone-300 accent-hijau-700"
      />
      <label htmlFor={id} className="text-sm text-stone-700">
        <span className="font-medium">{label}</span>
        {petunjuk && (
          <span id={`${id}-petunjuk`} className="block text-xs text-stone-500">
            {petunjuk}
          </span>
        )}
      </label>
    </div>
  );
}

export function Lencana({
  children,
  warna = "emas",
}: {
  children: ReactNode;
  warna?: "emas" | "abu" | "hijau" | "biru";
}) {
  const gaya = {
    emas: "bg-emas-100 text-emas-800 ring-emas-200",
    abu: "bg-stone-100 text-stone-600 ring-stone-200",
    hijau: "bg-hijau-50 text-hijau-700 ring-hijau-200",
    biru: "bg-sky-50 text-sky-800 ring-sky-200",
  }[warna];
  return (
    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[0.7rem] font-semibold ring-1 ${gaya}`}>
      {children}
    </span>
  );
}
