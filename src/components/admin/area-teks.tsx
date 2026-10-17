"use client";

import { useState, type TextareaHTMLAttributes } from "react";

/** Kolom teks beberapa baris dengan penghitung karakter. */
export function AreaTeks({
  label,
  name,
  galat,
  petunjuk,
  maxLength,
  defaultValue,
  onChange,
  id: idKustom,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
  name: string;
  galat?: string[];
  petunjuk?: string;
  defaultValue?: string;
}) {
  const id = idKustom ?? `bidang-${name}`;
  const [panjang, setPanjang] = useState((defaultValue ?? "").length);
  const adaGalat = Boolean(galat?.length);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-stone-700">
        {label}
        {props.required && <span className="text-red-600"> *</span>}
      </label>
      <textarea
        id={id}
        name={name}
        defaultValue={defaultValue}
        maxLength={maxLength}
        aria-invalid={adaGalat ? true : undefined}
        aria-describedby={`${id}-info`}
        onChange={(e) => {
          setPanjang(e.currentTarget.value.length);
          onChange?.(e);
        }}
        className="mt-1 block w-full rounded-xl border-0 bg-white px-3 py-2.5 text-base leading-relaxed text-stone-900 ring-1 ring-stone-300 placeholder:text-stone-400 focus:ring-2 focus:ring-hijau-600 focus:outline-none aria-[invalid=true]:ring-red-400 sm:text-sm"
        {...props}
      />
      <p id={`${id}-info`} className="mt-1 flex justify-between gap-3 text-xs">
        <span className={adaGalat ? "text-red-700" : "text-stone-500"}>{adaGalat ? galat?.[0] : petunjuk}</span>
        {maxLength !== undefined && (
          <span className="shrink-0 text-stone-500 tabular-nums">
            {panjang.toLocaleString("id-ID")}/{maxLength.toLocaleString("id-ID")}
          </span>
        )}
      </p>
    </div>
  );
}
