/**
 * Tema warna situs, dipilih pengurus di panel admin (Pengaturan → Tampilan).
 *
 * Setiap tema berisi dua ramp warna, "utama" (latar gelap, judul, tombol)
 * dan "aksen" (sorotan, label, tombol utama), masing-masing tingkat 50–950.
 * Kecerahan setiap tingkat (OKLCH L) sama dengan tema bawaan, hanya rona dan
 * kepekatannya yang berbeda, jadi kontras teks yang dirancang untuk tema
 * bawaan tetap terjaga di tema lain.
 *
 * Nilainya mengisi variabel CSS Tailwind (--color-utama-*, --color-aksen-*)
 * di elemen <html>, serta dipakai poster story dan jam analog layar TV.
 * Tema bawaan harus sama dengan nilai @theme di src/app/globals.css.
 */

export const TINGKAT = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950] as const;
export type Tingkat = (typeof TINGKAT)[number];

type Ramp = readonly [string, string, string, string, string, string, string, string, string, string, string];

export type Tema = {
  nama: string;
  deskripsi: string;
  utama: Ramp;
  aksen: Ramp;
  /** Latar bagian halaman yang berselang-seling dengan putih. */
  krem: string;
};

export const KUNCI_TEMA = ["zamrud", "kiswah", "samudra", "tosca", "marun", "lembayung", "kopi", "arang"] as const;
export type KunciTema = (typeof KUNCI_TEMA)[number];
export const TEMA_BAWAAN: KunciTema = "zamrud";

const EMAS: Ramp = [
  "#fcf8ea", "#f7edc8", "#efd98e", "#e6c155", "#dcaa31", "#c28d1f", "#a26e18", "#815217", "#6b4319", "#5b3819", "#3e240f",
];

export const TEMA: Record<KunciTema, Tema> = {
  zamrud: {
    nama: "Zamrud & Emas",
    deskripsi: "Hijau zamrud dengan aksen emas. Tema bawaan: teduh dan klasik.",
    utama: ["#eff8f3", "#d7efe1", "#b0dec6", "#7fc6a4", "#4ca880", "#2b8b64", "#1c6f4f", "#165a41", "#134835", "#0f3b2c", "#072219"],
    aksen: EMAS,
    krem: "#fbf8f0",
  },
  kiswah: {
    nama: "Kiswah",
    deskripsi: "Hitam pekat dengan aksen emas, seperti kain penutup Ka'bah. Elegan dan berwibawa.",
    utama: ["#f6f5f4", "#eae8e4", "#d5d1cb", "#b9b3aa", "#999388", "#7d776c", "#635e55", "#504c45", "#403d37", "#35322d", "#1e1c19"],
    aksen: EMAS,
    krem: "#fbf8f0",
  },
  samudra: {
    nama: "Biru Samudra",
    deskripsi: "Biru tua dengan aksen biru langit. Segar dan modern.",
    utama: ["#eff6fe", "#d9eafe", "#b3d5fe", "#82b7fb", "#5695e7", "#3c77c8", "#2f5ea2", "#284c84", "#223d69", "#1c3156", "#0f1c33"],
    aksen: ["#edfbfe", "#cff4ff", "#9be7fe", "#52d7fe", "#04c5f4", "#04a7d3", "#0586ac", "#006788", "#0f5570", "#13475f", "#0b2f41"],
    krem: "#f1fbfe",
  },
  tosca: {
    nama: "Tosca & Jingga",
    deskripsi: "Hijau kebiruan dengan aksen jingga. Hangat dan bersemangat.",
    utama: ["#eef8f8", "#d2efef", "#a7ddde", "#70c5c7", "#2ea6ab", "#04888e", "#056c72", "#01585d", "#00474c", "#033a3e", "#032124"],
    aksen: ["#fff6ef", "#fee8d7", "#ffcfac", "#feb17b", "#fe9347", "#de7936", "#b55f2c", "#8d4823", "#743c22", "#62321f", "#432014"],
    krem: "#fef8f2",
  },
  marun: {
    nama: "Marun",
    deskripsi: "Merah marun dengan aksen emas mawar. Anggun dan hangat.",
    utama: ["#fff2f2", "#ffe0df", "#ffbebf", "#f69498", "#de6a73", "#be4d5a", "#993a47", "#7c2f3a", "#632730", "#512027", "#301116"],
    aksen: ["#fff6ed", "#fee9d3", "#fed0a4", "#f6b67c", "#e7a165", "#c98653", "#a46b42", "#805134", "#69432d", "#593828", "#3d241a"],
    krem: "#fff8f1",
  },
  lembayung: {
    nama: "Lembayung",
    deskripsi: "Ungu senja dengan aksen merah muda. Lembut dan berbeda.",
    utama: ["#f7f3fe", "#ebe3ff", "#d7c7fe", "#bda3f8", "#9e7de4", "#8161c5", "#664ca0", "#513e82", "#403268", "#342955", "#1d1733"],
    aksen: ["#fff5f8", "#fee5ee", "#ffc8de", "#ffa6cd", "#f888be", "#d671a4", "#ad5a85", "#864568", "#6d3956", "#5c3149", "#3e2031"],
    krem: "#fef7f9",
  },
  kopi: {
    nama: "Kopi & Pasir",
    deskripsi: "Cokelat kopi dengan aksen warna pasir. Bersahaja dan alami.",
    utama: ["#f9f4f1", "#f3e5dc", "#e4ccbb", "#d0ac93", "#b4896c", "#976d51", "#79563f", "#624533", "#4f382a", "#402d22", "#251913"],
    aksen: ["#fcf7ef", "#f9ead7", "#f2d5ae", "#e6bd8a", "#d6a973", "#b98f5f", "#97724b", "#755739", "#604831", "#513c2a", "#37281b"],
    krem: "#fdf8f0",
  },
  arang: {
    nama: "Abu Arang",
    deskripsi: "Abu-abu gelap dengan aksen perak. Netral, tanpa warna mencolok.",
    utama: ["#f4f5f8", "#e4e8ee", "#cad2dc", "#aab5c4", "#8795a6", "#6c798a", "#55606e", "#454e59", "#373e47", "#2d333a", "#191d21"],
    aksen: ["#f6f8fa", "#e8edf2", "#d1dbe5", "#b9c7d4", "#a6b5c2", "#8c9aa6", "#707c86", "#565f67", "#474e55", "#3c4247", "#282c30"],
    krem: "#f6fafe",
  },
};

export const adalahKunciTema = (v: unknown): v is KunciTema => (KUNCI_TEMA as readonly unknown[]).includes(v);

/** Satu warna dari ramp tema, mis. warna(tema, "utama", 950). */
export function warna(tema: Tema, ramp: "utama" | "aksen", tingkat: Tingkat): string {
  return tema[ramp][TINGKAT.indexOf(tingkat)];
}

/** "#dcaa31" + 0.4 → "rgba(220,170,49,0.4)" (untuk Satori, yang tidak mengenal color-mix). */
export function rgba(hex: string, alfa: number): string {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alfa})`;
}

/** Pola bintang delapan (geometri Islam) sebagai SVG; dipakai utilitas pola-islami & poster. */
export function svgPolaIslami(garis: string, opasitas = 0.16): string {
  return `<svg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'><g fill='none' stroke='${garis}' stroke-opacity='${opasitas}' stroke-width='1'><path d='M28 4l7 17 17 7-17 7-7 17-7-17-17-7 17-7z'/><path d='M28 12l11.3 4.7L44 28l-4.7 11.3L28 44l-11.3-4.7L12 28l4.7-11.3z'/></g></svg>`;
}

export const urlPolaIslami = (garis: string, opasitas?: number) =>
  `url("data:image/svg+xml,${encodeURIComponent(svgPolaIslami(garis, opasitas))}")`;

/** Variabel CSS tema untuk atribut style elemen <html>. */
export function variabelTema(kunci: KunciTema): Record<`--${string}`, string> {
  const tema = TEMA[kunci];
  const hasil: Record<`--${string}`, string> = {};
  TINGKAT.forEach((t, i) => {
    hasil[`--color-utama-${t}`] = tema.utama[i];
    hasil[`--color-aksen-${t}`] = tema.aksen[i];
  });
  hasil["--color-krem"] = tema.krem;
  hasil["--pola-islami"] = urlPolaIslami(warna(tema, "aksen", 400));
  return hasil;
}
