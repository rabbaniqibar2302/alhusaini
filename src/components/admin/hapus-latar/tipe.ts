export type PesanKePekerja = { id: number; file: Blob };

export type PesanKeInduk =
  | { id: number; jenis: "unduh"; diterima: number; total: number }
  | { id: number; jenis: "proses" }
  | { id: number; jenis: "selesai"; blob: Blob; lebar: number; tinggi: number }
  | { id: number; jenis: "galat"; pesan: string };
