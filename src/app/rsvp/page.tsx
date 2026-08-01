"use client";

import { Suspense, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function RSVPRedirect() {
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Kompatibilitas link lama:
    //   1. Baru      : ?wedding=<slug>&to=<guestSlug>
    //   2. Lama (v1) : ?weddingId=<id>&to=<guestSlug>
    //   3. Legacy    : ?<wedding-slug>=<guest-slug>
    // Semua diarahkan ke halaman bertema: /public/weddings/<slug>?to=<guestSlug>
    const entries = Array.from(searchParams.entries());
    let weddingSlug = searchParams.get("wedding") || searchParams.get("weddingId");
    let guestSlug: string | null = null;

    if (weddingSlug) {
      guestSlug = searchParams.get("to");
    } else if (entries.length > 0) {
      weddingSlug = entries[0][0];
      guestSlug = entries[0][1] || null;
    }

    if (weddingSlug) {
      const target = `/public/weddings/${encodeURIComponent(weddingSlug)}${
        guestSlug ? `?to=${encodeURIComponent(guestSlug)}` : ""
      }`;
      router.replace(target);
    }
  }, [router, searchParams]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        <p className="text-muted-foreground">Mengalihkan ke undangan...</p>
      </div>
    </div>
  );
}

export default function RSVPFormPage() {
  return (
    <Suspense fallback={<div className="text-center py-12">Loading...</div>}>
      <RSVPRedirect />
    </Suspense>
  );
}
