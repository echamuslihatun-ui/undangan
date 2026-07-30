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

/**
 * Generate snap transaction token (untuk digunakan di frontend jika perlu redirect ke Midtrans)
 */
export function getSnapTransactionToken(payload: Record<string, unknown>): string | null {
  // Fungsi ini biasanya menggunakan Midtrans Snap API
  // Untuk sekarang kita return null, implementasi bisa ditambahkan nanti
  return null;
}