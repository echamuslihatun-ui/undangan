import crypto from "crypto";

/**
 * Verifikasi signature Midtrans webhook notification
 * Dokumentasi: https://docs.midtrans.com/en/technical-reference/signature
 */
export function verifyMidtransNotification(body: Record<string, unknown>): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    console.error("MIDTRANS_SERVER_KEY tidak ditemukan di environment");
    return false;
  }

  const { order_id, status_code, gross_amount, signature_key } = body;

  if (!order_id || !status_code || !gross_amount || !signature_key) {
    console.error("Webhook payload tidak lengkap untuk verifikasi signature");
    return false;
  }

  // Format: order_id + status_code + gross_amount + server_key
  const input = `${order_id}${status_code}${gross_amount}${serverKey}`;
  const expectedSignature = crypto.createHash("sha512").update(input).digest("hex");

  return expectedSignature === signature_key;
}

/** true bila environment diarahkan ke Midtrans production */
export function isMidtransProduction(): boolean {
  return process.env.MIDTRANS_IS_PRODUCTION === "true";
}

/** Base URL Snap API sesuai environment (sandbox vs production) */
function getSnapBaseUrl(): string {
  return isMidtransProduction()
    ? "https://app.midtrans.com/snap/v1/transactions"
    : "https://app.sandbox.midtrans.com/snap/v1/transactions";
}

/** Base URL Core API, dipakai untuk cek status transaksi */
function getCoreApiBaseUrl(): string {
  return isMidtransProduction()
    ? "https://api.midtrans.com/v2"
    : "https://api.sandbox.midtrans.com/v2";
}

/** Snap token kedaluwarsa 24 jam setelah transaksi dibuat */
export const SNAP_TOKEN_TTL_HOURS = 24;

export type MidtransStatus = {
  transactionStatus: string | null;
  paymentType: string | null;
  fraudStatus: string | null;
  /** Nomor VA / biller bila tersedia, untuk ditampilkan kembali ke user */
  vaNumbers: { bank: string; va_number: string }[];
  billerCode: string | null;
  billKey: string | null;
  statusCode: string | null;
  statusMessage: string | null;
};

/**
 * Menanyakan status transaksi langsung ke Midtrans (Core API).
 * Berguna sebagai fallback bila webhook tidak sampai, mis. saat pengembangan lokal.
 * Throw Error bila konfigurasi belum ada atau Midtrans membalas selain 200/404.
 */
export async function getMidtransTransactionStatus(orderId: string): Promise<MidtransStatus> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY belum diatur di environment");
  }

  const auth = Buffer.from(`${serverKey}:`).toString("base64");
  const res = await fetch(`${getCoreApiBaseUrl()}/${encodeURIComponent(orderId)}/status`, {
    method: "GET",
    headers: {
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
    cache: "no-store",
  });

  const data = (await res.json().catch(() => null)) as Record<string, unknown> | null;

  // 404 berarti transaksi belum pernah dibayar/tercatat di Midtrans; bukan error fatal.
  if (!res.ok && res.status !== 404) {
    const detail = (data?.status_message as string) || `HTTP ${res.status}`;
    throw new Error(`Gagal mengambil status transaksi: ${detail}`);
  }

  return {
    transactionStatus: (data?.transaction_status as string) ?? null,
    paymentType: (data?.payment_type as string) ?? null,
    fraudStatus: (data?.fraud_status as string) ?? null,
    vaNumbers: (data?.va_numbers as { bank: string; va_number: string }[]) ?? [],
    billerCode: (data?.biller_code as string) ?? null,
    billKey: (data?.bill_key as string) ?? null,
    statusCode: (data?.status_code as string) ?? null,
    statusMessage: (data?.status_message as string) ?? null,
  };
}

/**
 * Memetakan transaction_status Midtrans ke status Order internal.
 * Mengembalikan null bila status tidak mengubah apa pun (mis. masih pending).
 */
export function mapMidtransStatusToOrderStatus(
  transactionStatus: string | null,
  fraudStatus?: string | null
): "success" | "failed" | null {
  if (!transactionStatus) return null;

  if (transactionStatus === "capture" || transactionStatus === "settlement") {
    // Pada kartu kredit, capture dengan fraud_status challenge belum boleh dianggap lunas.
    if (fraudStatus === "challenge") return null;
    return "success";
  }

  if (["deny", "expire", "cancel", "failure"].includes(transactionStatus)) {
    return "failed";
  }

  return null;
}


/**
 * Metode pembayaran yang dipilih user di dashboard dipetakan ke channel Midtrans.
 * Dikirim sebagai `enabled_payments` supaya halaman Snap langsung memfilter pilihan.
 * Referensi channel: https://docs.midtrans.com/reference/multiple-payment-methods
 */
const PAYMENT_CHANNELS: Record<string, string[]> = {
  qris: ["other_qris"],
  transfer: ["bank_transfer", "permata_va", "bca_va", "bni_va", "bri_va", "echannel"],
  ewallet: ["gopay", "shopeepay"],
};

export type SnapTransactionInput = {
  orderId: string;
  grossAmount: number;
  itemName: string;
  /** qris | transfer | ewallet. Bila kosong, semua metode ditampilkan Snap. */
  method?: string | null;
  customerName?: string | null;
  customerEmail?: string | null;
};

export type SnapTransaction = {
  token: string;
  redirectUrl: string;
};

/**
 * Membuat transaksi Snap dan mengembalikan token + redirect URL.
 * Server key hanya dipakai di sisi server (Basic Auth), jangan pernah diekspos ke client.
 * Throw Error bila konfigurasi belum ada atau Midtrans menolak request.
 */
export async function createSnapTransaction(
  input: SnapTransactionInput
): Promise<SnapTransaction> {
  const serverKey = process.env.MIDTRANS_SERVER_KEY;
  if (!serverKey) {
    throw new Error("MIDTRANS_SERVER_KEY belum diatur di environment");
  }

  const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const payload: Record<string, unknown> = {
    transaction_details: {
      order_id: input.orderId,
      gross_amount: input.grossAmount,
    },
    item_details: [
      {
        id: input.orderId,
        name: input.itemName.slice(0, 50), // Midtrans membatasi 50 karakter
        price: input.grossAmount,
        quantity: 1,
      },
    ],
    callbacks: {
      finish: `${appUrl}/dashboard/pembayaran`,
    },
  };

  if (input.customerName || input.customerEmail) {
    payload.customer_details = {
      first_name: input.customerName || undefined,
      email: input.customerEmail || undefined,
    };
  }

  const channels = input.method ? PAYMENT_CHANNELS[input.method] : undefined;
  if (channels) {
    payload.enabled_payments = channels;
  }

  const auth = Buffer.from(`${serverKey}:`).toString("base64");

  const res = await fetch(getSnapBaseUrl(), {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Basic ${auth}`,
    },
    body: JSON.stringify(payload),
  });

  const data = (await res.json().catch(() => null)) as
    | { token?: string; redirect_url?: string; error_messages?: string[] }
    | null;

  if (!res.ok || !data?.token || !data?.redirect_url) {
    const detail = data?.error_messages?.join("; ") || `HTTP ${res.status}`;
    throw new Error(`Midtrans menolak pembuatan transaksi: ${detail}`);
  }

  return { token: data.token, redirectUrl: data.redirect_url };
}
