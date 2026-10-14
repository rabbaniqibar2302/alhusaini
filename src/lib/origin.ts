/**
 * Proteksi CSRF: setiap request yang mengubah data wajib membawa header
 * Origin yang sama persis (skema + host + port) dengan situs ini. Request
 * tanpa Origin (atau Origin "null") ditolak. Dipakai oleh proxy dan server
 * action.
 *
 * @param host      nilai x-forwarded-host / host dari request
 * @param protokol  nilai x-forwarded-proto (mis. "https"); di Vercel selalu https
 */
export function originSama(origin: string | null, host: string | null, protokol?: string | null): boolean {
  if (!origin || !host || origin === "null") return false;
  let url: URL;
  try {
    url = new URL(origin);
  } catch {
    return false;
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") return false;
  const hostDiharapkan = host.split(",")[0].trim().toLowerCase();
  if (url.host.toLowerCase() !== hostDiharapkan) return false;
  const proto = protokol?.split(",")[0].trim().replace(/:$/, "").toLowerCase();
  return proto ? url.protocol === `${proto}:` : true;
}
