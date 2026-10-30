import "server-only";

/**
 * Alamat publik situs: SITE_URL (domain sendiri) bila diisi, atau domain
 * produksi Vercel. Dipakai untuk metadata dan tautan di poster yang dibagikan.
 */
export function urlSitus(): URL {
  const dariEnv = process.env.SITE_URL ?? process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (!dariEnv) return new URL("http://localhost:3000");
  return new URL(dariEnv.startsWith("http") ? dariEnv : `https://${dariEnv}`);
}
