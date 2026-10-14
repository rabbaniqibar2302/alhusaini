// Utilitas kecil untuk script CLI: membaca input dari terminal.
import readline from "node:readline";

/** Membaca satu baris tanpa menampilkan karakter yang diketik (untuk password). */
export function bacaTersembunyi(pertanyaan) {
  const stdin = process.stdin;
  if (!stdin.isTTY) {
    // Input dari pipe: baca sampai habis, ambil baris pertama.
    return new Promise((resolve, reject) => {
      let data = "";
      stdin.setEncoding("utf8");
      stdin.on("data", (c) => (data += c));
      stdin.on("end", () => resolve(data.split(/\r?\n/)[0]));
      stdin.on("error", reject);
    });
  }
  process.stdout.write(pertanyaan);
  stdin.setRawMode(true);
  stdin.resume();
  stdin.setEncoding("utf8");
  let isi = "";
  return new Promise((resolve) => {
    const saatData = (potongan) => {
      for (const c of potongan) {
        if (c === "\r" || c === "\n") {
          stdin.setRawMode(false);
          stdin.pause();
          stdin.off("data", saatData);
          process.stdout.write("\n");
          resolve(isi);
          return;
        }
        if (c === "\u0003") {
          process.stdout.write("\n");
          process.exit(130);
        }
        if (c === "\u007f" || c === "\b") {
          isi = isi.slice(0, -1);
          continue;
        }
        isi += c;
      }
    };
    stdin.on("data", saatData);
  });
}

/** Membaca satu baris biasa (terlihat). */
export function tanya(pertanyaan) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) =>
    rl.question(pertanyaan, (jawab) => {
      rl.close();
      resolve(jawab);
    }),
  );
}
