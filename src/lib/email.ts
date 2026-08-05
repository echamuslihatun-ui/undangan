import { logger } from "@/lib/logger";

type AccountEmailKind = "verify" | "reset";

const EMAIL_COPY = {
  verify: {
    subject: "Verifikasi email Undanganku",
    title: "Verifikasi alamat email Anda",
    action: "Verifikasi email",
    description: "Klik tombol berikut untuk mengaktifkan akun Undanganku Anda. Tautan berlaku selama 24 jam.",
  },
  reset: {
    subject: "Atur ulang password Undanganku",
    title: "Atur ulang password Anda",
    action: "Buat password baru",
    description: "Kami menerima permintaan penggantian password. Tautan ini berlaku selama 30 menit. Abaikan email ini jika Anda tidak memintanya.",
  },
} as const;

export async function sendAccountEmail(to: string, link: string, kind: AccountEmailKind): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const copy = EMAIL_COPY[kind];

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Konfigurasi email belum tersedia");
    }
    logger.info(`Development ${kind} link`, { to, link });
    return;
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10_000);
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to],
        subject: copy.subject,
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#292524"><h2>${copy.title}</h2><p>${copy.description}</p><p style="margin:28px 0"><a href="${link}" style="background:#be185d;color:white;padding:12px 20px;border-radius:8px;text-decoration:none">${copy.action}</a></p><p style="font-size:12px;color:#78716c;word-break:break-all">${link}</p></div>`,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Email provider merespons ${response.status}`);
  } finally {
    clearTimeout(timeout);
  }
}