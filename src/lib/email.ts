import { logger } from "@/lib/logger";

type AccountEmailKind = "verify" | "reset";

// Jenis email transaksional tambahan di luar verifikasi/reset akun.
type TransactionalEmailKind = "payment_success" | "wedding_active" | "new_rsvp";

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

const TRANSACTIONAL_COPY: Record<TransactionalEmailKind, { subject: string; title: string; description: string }> = {
  payment_success: {
    subject: "Pembayaran berhasil — Undanganku",
    title: "Pembayaran Anda berhasil 🎉",
    description: "Terima kasih! Pembayaran paket undangan Anda telah kami terima. Undangan Anda kini aktif dan siap disebarkan ke tamu.",
  },
  wedding_active: {
    subject: "Undangan Anda aktif — Undanganku",
    title: "Undangan Anda sudah aktif ✨",
    description: "Selamat! Undangan pernikahan digital Anda telah aktif. Anda dapat mulai menambahkan tamu dan membagikan tautan undangan.",
  },
  new_rsvp: {
    subject: "Ada RSVP baru — Undanganku",
    title: "Tamu baru mengonfirmasi kehadiran",
    description: "Salah satu tamu Anda baru saja mengisi RSVP. Buka dashboard untuk melihat detail konfirmasi kehadiran.",
  },
};

/**
 * Kirim email transaksional (pembayaran sukses, undangan aktif, RSVP baru).
 * Di development tanpa RESEND_API_KEY, email dicetak ke log server agar alur
 * tetap bisa diuji secara lokal.
 */
export async function sendTransactionalEmail(
  to: string,
  kind: TransactionalEmailKind,
  extra: { name?: string; detail?: string } = {}
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  const copy = TRANSACTIONAL_COPY[kind];

  if (!apiKey || !from) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Konfigurasi email belum tersedia");
    }
    logger.info(`Development ${kind} email`, { to, ...extra });
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
        html: `<div style="font-family:Arial,sans-serif;max-width:560px;margin:auto;color:#292524">
          <h2>${copy.title}</h2>
          <p>${copy.description}</p>
          ${extra.name ? `<p style="margin:20px 0;padding:12px;background:#f5f5f4;border-radius:8px"><strong>${extra.name}</strong></p>` : ""}
          ${extra.detail ? `<p style="font-size:13px;color:#78716c">${extra.detail}</p>` : ""}
          <p style="margin:28px 0"><a href="${process.env.NEXTAUTH_URL || "http://localhost:3000"}/dashboard" style="background:#be185d;color:white;padding:12px 20px;border-radius:8px;text-decoration:none">Buka Dashboard</a></p>
        </div>`,
      }),
      signal: controller.signal,
    });
    if (!response.ok) throw new Error(`Email provider merespons ${response.status}`);
  } finally {
    clearTimeout(timeout);
  }
}

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