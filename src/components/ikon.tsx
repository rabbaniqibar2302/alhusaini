import type { SVGProps } from "react";

/** Ikon SVG inline (tanpa library tambahan). Dekoratif: aria-hidden. */
type IkonProps = SVGProps<SVGSVGElement>;

function Dasar({ children, ...props }: IkonProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      {...props}
    >
      {children}
    </svg>
  );
}

export const IkonMasjid = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M12 2.5c.4 1 1.4 1.6 1.4 1.6S12.6 4 12 4.8c-.6-.8-1.4-.7-1.4-.7s1-.6 1.4-1.6Z" fill="currentColor" stroke="none" />
    <path d="M6.5 11c0-3 2.5-5 5.5-6 3 1 5.5 3 5.5 6" />
    <path d="M5 21V11h14v10" />
    <path d="M2.5 21V9.5M2 9.5h1M21.5 21V9.5M21 9.5h1" />
    <path d="M10 21v-4a2 2 0 0 1 4 0v4" />
    <path d="M1.5 21h21" />
  </Dasar>
);

export const IkonJam = (p: IkonProps) => (
  <Dasar {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </Dasar>
);

export const IkonKalender = (p: IkonProps) => (
  <Dasar {...p}>
    <rect x="3" y="5" width="18" height="16" rx="2" />
    <path d="M3 10h18M8 3v4M16 3v4" />
  </Dasar>
);

export const IkonBulanSabit = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
    <path d="m17 3 .6 1.4L19 5l-1.4.6L17 7l-.6-1.4L15 5l1.4-.6Z" fill="currentColor" stroke="none" />
  </Dasar>
);

export const IkonPin = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" />
    <circle cx="12" cy="9.5" r="2.5" />
  </Dasar>
);

export const IkonTelepon = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M5 4h3l2 5-2.5 1.5a11 11 0 0 0 6 6L15 14l5 2v3a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2Z" />
  </Dasar>
);

export const IkonWhatsApp = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M3.5 20.5 5 16a8.5 8.5 0 1 1 3 3Z" />
    <path d="M9 8.5c0 3.5 3 6.5 6.5 6.5l1-1.5-2-1-1 .8a5 5 0 0 1-2.3-2.3l.8-1-1-2L9.5 8Z" />
  </Dasar>
);

export const IkonEmail = (p: IkonProps) => (
  <Dasar {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <path d="m3.5 6 8.5 7 8.5-7" />
  </Dasar>
);

export const IkonInstagram = (p: IkonProps) => (
  <Dasar {...p}>
    <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
  </Dasar>
);

export const IkonAmbulans = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M2.5 16.5V7h11v9.5M13.5 10h4l3.5 3.5v3h-1.5" />
    <circle cx="7" cy="17.5" r="1.8" />
    <circle cx="17" cy="17.5" r="1.8" />
    <path d="M8.8 17.5h6.4M2.5 16.5h2.7M8 9.3v4M6 11.3h4" />
  </Dasar>
);

export const IkonDokumen = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M6 2.5h8l4.5 4.5v14.5H6Z" />
    <path d="M14 2.5V7h4.5M9 12h6M9 15.5h6M9 8.5h2" />
  </Dasar>
);

export const IkonPerisai = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M12 3 4.5 6v5.5c0 4.4 3.1 8.2 7.5 9.5 4.4-1.3 7.5-5.1 7.5-9.5V6Z" />
    <path d="m8.8 12 2.2 2.2 4.4-4.4" />
  </Dasar>
);

export const IkonBuku = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M12 6.5C10 5 7 4.5 3.5 5v13c3.5-.5 6.5 0 8.5 1.5 2-1.5 5-2 8.5-1.5V5C17 4.5 14 5 12 6.5Z" />
    <path d="M12 6.5v13" />
  </Dasar>
);

export const IkonMikrofon = (p: IkonProps) => (
  <Dasar {...p}>
    <rect x="9" y="3" width="6" height="11" rx="3" />
    <path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21M8.5 21h7" />
  </Dasar>
);

export const IkonMatahari = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M4 17h16M7 17a5 5 0 0 1 10 0M12 8V5M5.6 10.6 3.9 8.9M18.4 10.6l1.7-1.7M2.5 21h19" />
  </Dasar>
);

export const IkonSilang = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M6 6l12 12M18 6 6 18" />
  </Dasar>
);

export const IkonKiri = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="m15 5-7 7 7 7" />
  </Dasar>
);

export const IkonKanan = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="m9 5 7 7-7 7" />
  </Dasar>
);

export const IkonPerbesar = (p: IkonProps) => (
  <Dasar {...p}>
    <circle cx="10.5" cy="10.5" r="6.5" />
    <path d="m20 20-4.8-4.8M10.5 7.5v6M7.5 10.5h6" />
  </Dasar>
);

export const IkonTautanLuar = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" />
  </Dasar>
);

export const IkonPensil = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M4 20h4L19.5 8.5a2.1 2.1 0 0 0-4-4L4 16Z" />
    <path d="m14 6 4 4" />
  </Dasar>
);

export const IkonSampah = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M4 7h16M9.5 7V4.5h5V7M6 7l1 13h10l1-13M10 11v5M14 11v5" />
  </Dasar>
);

export const IkonUnggah = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M12 16V4M7 9l5-5 5 5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </Dasar>
);

export const IkonUnduh = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M12 4v12M7 11l5 5 5-5M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
  </Dasar>
);

export const IkonBagikan = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M12 15V3M8 7l4-4 4 4" />
    <path d="M8.5 10.5H6a1 1 0 0 0-1 1V20a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-8.5a1 1 0 0 0-1-1h-2.5" />
  </Dasar>
);

export const IkonKeluar = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M14 4h4a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-4M9 16l-4-4 4-4M5 12h11" />
  </Dasar>
);

export const IkonCentang = (p: IkonProps) => (
  <Dasar {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="m8 12 3 3 5-6" />
  </Dasar>
);

export const IkonPeringatan = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M12 3.5 2.5 20h19Z" />
    <path d="M12 10v4.5M12 17.2v.1" />
  </Dasar>
);

export const IkonInfo = (p: IkonProps) => (
  <Dasar {...p}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 11v5.5M12 7.8v.1" />
  </Dasar>
);

export const IkonGembok = (p: IkonProps) => (
  <Dasar {...p}>
    <rect x="4.5" y="10.5" width="15" height="10" rx="2" />
    <path d="M8 10.5V7.5a4 4 0 0 1 8 0v3M12 14.5v2.5" />
  </Dasar>
);

export const IkonFoto = (p: IkonProps) => (
  <Dasar {...p}>
    <rect x="3" y="5" width="18" height="14" rx="2" />
    <circle cx="9" cy="10" r="1.8" />
    <path d="m4 18 5.5-5 3.5 3 3-2.5 4 3.5" />
  </Dasar>
);

export const IkonPengguna = (p: IkonProps) => (
  <Dasar {...p}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4.5 20.5a7.5 7.5 0 0 1 15 0" />
  </Dasar>
);

export const IkonBintang = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="m12 3.5 2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9Z" />
  </Dasar>
);

export const IkonPengumuman = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M4 10v4a1 1 0 0 0 1 1h2l5 4V5L7 9H5a1 1 0 0 0-1 1Z" />
    <path d="M16 9a4 4 0 0 1 0 6M18.5 6.5a7.5 7.5 0 0 1 0 11" />
  </Dasar>
);

export const IkonTv = (p: IkonProps) => (
  <Dasar {...p}>
    <rect x="2.5" y="5" width="19" height="12.5" rx="2" />
    <path d="M8 21h8M12 17.5V21" />
  </Dasar>
);

export const IkonSejarah = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M3 5.5c2.5-1 5.5-1 9 1 3.5-2 6.5-2 9-1v13c-2.5-1-5.5-1-9 1-3.5-2-6.5-2-9-1Z" />
    <path d="M12 6.5v13" />
  </Dasar>
);

export const IkonLayarPenuh = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5" />
  </Dasar>
);

export const IkonFajar = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M3 18h18M6.5 18a5.5 5.5 0 0 1 11 0" />
    <path d="M12 8V4M9.5 6 12 3.5 14.5 6M4.2 12.2l1.4 1.4M19.8 12.2l-1.4 1.4" />
  </Dasar>
);

export const IkonSenja = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M3 18h18M6.5 18a5.5 5.5 0 0 1 11 0" />
    <path d="M12 3.5v4M9.5 5 12 7.5 14.5 5M4.2 12.2l1.4 1.4M19.8 12.2l-1.4 1.4" />
  </Dasar>
);

export const IkonBulan = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M20 14.5A8.5 8.5 0 1 1 9.5 4a7 7 0 0 0 10.5 10.5Z" />
  </Dasar>
);

export const IkonBuka = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M5 12h14M13 6l6 6-6 6" />
  </Dasar>
);

export const IkonSuara = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M4 10v4a1 1 0 0 0 1 1h3l5 4V5L8 9H5a1 1 0 0 0-1 1Z" />
    <path d="M16.5 8.5a5 5 0 0 1 0 7M19 6a8.5 8.5 0 0 1 0 12" />
  </Dasar>
);

export const IkonSuaraMati = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M4 10v4a1 1 0 0 0 1 1h3l5 4V5L8 9H5a1 1 0 0 0-1 1Z" />
    <path d="m16.5 9.5 5 5M21.5 9.5l-5 5" />
  </Dasar>
);

export const IkonSalin = (p: IkonProps) => (
  <Dasar {...p}>
    <rect x="9" y="9" width="11" height="11" rx="2" />
    <path d="M15 9V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v7a2 2 0 0 0 2 2h3" />
  </Dasar>
);

export const IkonDompet = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M19 7V5.5A1.5 1.5 0 0 0 17.5 4H5a2 2 0 0 0 0 4h14a1 1 0 0 1 1 1v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6" />
    <path d="M16 14h.01" strokeWidth={3} />
  </Dasar>
);

export const IkonQr = (p: IkonProps) => (
  <Dasar {...p}>
    <rect x="3.5" y="3.5" width="6" height="6" rx="1" />
    <rect x="14.5" y="3.5" width="6" height="6" rx="1" />
    <rect x="3.5" y="14.5" width="6" height="6" rx="1" />
    <path d="M14.5 14.5h2.5v2.5M20.5 14.5v.01M14.5 20.5h.01M17.5 20.5h3v-3" />
  </Dasar>
);

export const IkonGrafik = (p: IkonProps) => (
  <Dasar {...p}>
    <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
  </Dasar>
);
