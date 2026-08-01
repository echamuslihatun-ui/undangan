import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * Upload file ke Cloudinary (signed upload).
 * Kredensial hanya dipakai di server; signature dihitung dari API secret.
 * Dokumentasi: https://cloudinary.com/documentation/upload_images#generating_authentication_signatures
 */
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (!cloudName || !apiKey || !apiSecret) {
      console.error("Kredensial Cloudinary belum diatur di environment");
      return NextResponse.json(
        { error: "Konfigurasi upload belum lengkap di server" },
        { status: 500 }
      );
    }

    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "Tidak ada file yang diupload" }, { status: 400 });
    }

    // Validasi tipe file
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif", "audio/mpeg", "audio/mp3"];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Tipe file tidak didukung. Gunakan JPG, PNG, WebP, GIF, atau MP3" },
        { status: 400 }
      );
    }

    // Validasi ukuran (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({ error: "File terlalu besar. Maksimal 10MB" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Parameter yang ditandatangani (harus urut alfabet saat membuat signature)
    const timestamp = Math.round(Date.now() / 1000);
    const folder = "undangan";
    const paramsToSign = `folder=${folder}&timestamp=${timestamp}`;
    const signature = crypto
      .createHash("sha1")
      .update(paramsToSign + apiSecret)
      .digest("hex");

    // Cloudinary menerima file base64 data URI untuk upload dari server
    const dataUri = `data:${file.type};base64,${buffer.toString("base64")}`;

    const uploadForm = new FormData();
    uploadForm.append("file", dataUri);
    uploadForm.append("api_key", apiKey);
    uploadForm.append("timestamp", String(timestamp));
    uploadForm.append("folder", folder);
    uploadForm.append("signature", signature);

    // `auto` mendukung gambar maupun audio (mp3)
    const uploadUrl = `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`;
    const res = await fetch(uploadUrl, { method: "POST", body: uploadForm });

    const data = (await res.json().catch(() => null)) as
      | { secure_url?: string; error?: { message?: string } }
      | null;

    if (!res.ok || !data?.secure_url) {
      const detail = data?.error?.message || `HTTP ${res.status}`;
      console.error("Cloudinary upload error:", detail);
      return NextResponse.json({ error: "Gagal upload file" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      url: data.secure_url,
      fileName: file.name,
      size: file.size,
      type: file.type,
    });
  } catch (error) {
    console.error("Upload error:", error);
    return NextResponse.json({ error: "Gagal upload file" }, { status: 500 });
  }
}
