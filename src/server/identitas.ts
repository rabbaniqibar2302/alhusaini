import "server-only";
import { cacheLife, cacheTag } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import type { Identitas } from "@/lib/schemas";
import { IDENTITAS_BAWAAN } from "@/lib/site";
import { TAG_KONTEN, bacaKonten } from "./store";

/**
 * Identitas masjid untuk bagian yang tidak membaca seluruh konten: metadata
 * (judul tab & hasil pencarian), panel admin, dan halaman login. Di-cache
 * dengan tag konten, jadi langsung diperbarui begitu admin menyimpan. Bila
 * database bermasalah, dipakai identitas bawaan dan hanya di-cache sebentar.
 */
export async function bacaIdentitas(): Promise<Identitas> {
  "use cache";
  cacheTag(TAG_KONTEN);
  try {
    const identitas = await bacaKonten("identitas");
    cacheLife({ stale: 300, revalidate: 600, expire: 3600 });
    return identitas;
  } catch (err) {
    unstable_rethrow(err);
    console.error("[identitas] Gagal membaca database:", err);
    cacheLife("minutes");
    return IDENTITAS_BAWAAN;
  }
}
