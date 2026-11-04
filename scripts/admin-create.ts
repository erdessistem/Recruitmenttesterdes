const { loadEnvConfig } = require("@next/env") as typeof import("@next/env");
import { hash } from "bcryptjs";
import { z } from "zod";
loadEnvConfig(process.cwd());
async function main() {
  const email = z.email().parse(process.env.ADMIN_EMAIL?.trim().toLowerCase());
  const password = process.env.ADMIN_PASSWORD ?? "";
  if (password.length < 8 || Buffer.byteLength(password, "utf8") > 72) throw new Error("ADMIN_PASSWORD harus minimal 8 karakter dan maksimal 72 byte.");
  const { createSheetsRepository } = await import("../lib/repositories/sheets");
  await createSheetsRepository().createAdmin({ email, name: "Superadmin", passwordHash: await hash(password, 12) });
  process.stdout.write("Akun superadmin dibuat. Hapus ADMIN_PASSWORD dari environment setelah selesai.\n");
}
main().catch(error => { process.stderr.write(`Pembuatan admin gagal: ${error instanceof Error ? error.message : "kesalahan tidak diketahui"}\n`); process.exitCode = 1; });
