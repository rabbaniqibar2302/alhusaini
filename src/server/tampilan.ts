import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { TEMA_BAWAAN, type KunciTema } from "@/lib/tema";
import { TAG_KONTEN, bacaKonten } from "./store";

/**
 * Tema warna pilihan pengurus untuk seluruh situs (dibaca layout utama).
 * Di-cache dengan tag konten seperti halaman publik, jadi langsung berganti
 * begitu admin menyimpan. Bila database bermasalah, dipakai tema bawaan dan
 * hanya di-cache sebentar.
 */
export async function bacaTema(): Promise<KunciTema> {
  "use cache";
  cacheTag(TAG_KONTEN);
  try {
    const { tema } = await bacaKonten("tampilan");
    cacheLife({ stale: 300, revalidate: 600, expire: 3600 });
    return tema;
  } catch (err) {
    unstable_rethrow(err);
    console.error("[tampilan] Gagal membaca database:", err);
    cacheLife("minutes");
    return TEMA_BAWAAN;
  }
}
