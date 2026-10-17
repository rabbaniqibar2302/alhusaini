"use client";

import { useState } from "react";
import { IkonCentang, IkonSalin } from "@/components/ikon";

export function TombolSalin({ teks, label }: { teks: string; label: string }) {
  const [tersalin, setTersalin] = useState(false);
  async function salin() {
    try {
      await navigator.clipboard.writeText(teks);
      setTersalin(true);
      setTimeout(() => setTersalin(false), 2000);
    } catch {
      // Clipboard tidak tersedia (mis. bukan HTTPS); nomor tetap bisa diblok manual.
    }
  }
  return (
    <button
      type="button"
      onClick={salin}
      aria-label={label}
      className={`inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold ring-1 transition ${
        tersalin ? "bg-hijau-700 text-white ring-hijau-700" : "bg-white text-hijau-800 ring-hijau-200 hover:bg-hijau-50"
      }`}
    >
      {tersalin ? <IkonCentang className="size-3.5" /> : <IkonSalin className="size-3.5" />}
      <span aria-live="polite">{tersalin ? "Tersalin" : "Salin"}</span>
    </button>
  );
}
