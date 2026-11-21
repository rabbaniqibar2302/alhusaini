/**
 * Angka yang setiap digitnya muncul dengan animasi saat berubah (hitung
 * mundur). Digit yang tidak berubah tidak ikut bergerak karena kuncinya sama.
 */
export function AngkaBerganti({ teks, className = "" }: { teks: string; className?: string }) {
  return (
    <span className={`inline-flex ${className}`}>
      {[...teks].map((c, i) =>
        /\d/.test(c) ? (
          <span key={`${i}-${c}`} className="inline-block motion-safe:animate-angka">
            {c}
          </span>
        ) : (
          <span key={`${i}-pemisah`}>{c}</span>
        ),
      )}
    </span>
  );
}
