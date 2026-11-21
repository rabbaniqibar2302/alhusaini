import { WIB_OFFSET_MS } from "@/lib/time";

const TITIK = Array.from({ length: 60 }, (_, i) => i);

/** Jam analog (WIB) dalam SVG; jarum dihitung dari `sekarang`. */
export function JamAnalog({ sekarang, className = "" }: { sekarang: number | null; className?: string }) {
  const d = sekarang === null ? null : new Date(sekarang + WIB_OFFSET_MS);
  const jam = d ? d.getUTCHours() % 12 : 0;
  const menit = d ? d.getUTCMinutes() : 0;
  const detik = d ? d.getUTCSeconds() : 0;
  const sudutJam = (jam + menit / 60) * 30;
  const sudutMenit = (menit + detik / 60) * 6;
  const sudutDetik = detik * 6;

  return (
    <svg viewBox="0 0 200 200" className={className} aria-hidden="true">
      <circle cx="100" cy="100" r="97" className="fill-utama-950 stroke-aksen-400" strokeWidth="5" />
      <circle cx="100" cy="100" r="88" className="fill-utama-900" />
      {TITIK.map((i) => {
        const besar = i % 5 === 0;
        return (
          <line
            key={i}
            x1="100"
            y1={besar ? 18 : 16}
            x2="100"
            y2={besar ? 31 : 22}
            className={besar ? "stroke-aksen-300" : "stroke-utama-300"}
            strokeWidth={besar ? 4 : 1.5}
            strokeLinecap="round"
            transform={`rotate(${i * 6} 100 100)`}
          />
        );
      })}
      {d && (
        <>
          <line
            x1="100"
            y1="112"
            x2="100"
            y2="54"
            stroke="#ffffff"
            strokeWidth="8"
            strokeLinecap="round"
            transform={`rotate(${sudutJam} 100 100)`}
          />
          <line
            x1="100"
            y1="116"
            x2="100"
            y2="32"
            stroke="#ffffff"
            strokeWidth="5"
            strokeLinecap="round"
            transform={`rotate(${sudutMenit} 100 100)`}
          />
          <line
            x1="100"
            y1="124"
            x2="100"
            y2="26"
            className="stroke-aksen-300"
            strokeWidth="2.5"
            strokeLinecap="round"
            transform={`rotate(${sudutDetik} 100 100)`}
          />
        </>
      )}
      <circle cx="100" cy="100" r="7" className="fill-aksen-300" />
      <circle cx="100" cy="100" r="3" className="fill-utama-950" />
    </svg>
  );
}
