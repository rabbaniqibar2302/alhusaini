"use client";

import { Bidang, PesanHasil, TombolKirim } from "@/components/admin/ui";
import { useFormAksi } from "@/components/admin/use-form-aksi";
import { login } from "@/server/aksi/auth";

export function FormLogin({ totpAktif }: { totpAktif: boolean }) {
  const form = useFormAksi(login, {
    resetSaatSukses: false,
    onSelesai: (hasil, el) => {
      if (hasil.ok || !el) return;
      // Kosongkan password & kode setelah gagal; username dibiarkan.
      for (const nama of ["password", "kode"]) {
        const input = el.elements.namedItem(nama);
        if (input instanceof HTMLInputElement) input.value = "";
      }
    },
  });

  return (
    <form onSubmit={form.onSubmit} className="space-y-4">
      <Bidang
        label="Username"
        name="username"
        autoComplete="username"
        autoCapitalize="none"
        spellCheck={false}
        required
        maxLength={64}
      />
      <Bidang label="Password" name="password" type="password" autoComplete="current-password" required maxLength={128} />
      {totpAktif && (
        <Bidang
          label="Kode verifikasi (Google Authenticator)"
          name="kode"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="[0-9]{6}"
          maxLength={6}
          placeholder="6 digit"
          required
        />
      )}
      <PesanHasil hasil={form.hasil} />
      <TombolKirim pending={form.pending} className="w-full">
        Masuk
      </TombolKirim>
    </form>
  );
}
