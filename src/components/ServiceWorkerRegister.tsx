"use client";

import { useEffect } from "react";

/**
 * Mendaftarkan service worker untuk dukungan PWA (offline & installable).
 * Hanya berjalan di production agar tidak mengganggu saat development.
 */
export default function ServiceWorkerRegister() {
  useEffect(() => {
    if (
      process.env.NODE_ENV !== "production" ||
      !("serviceWorker" in navigator)
    ) {
      return;
    }

    const register = async () => {
      try {
        await navigator.serviceWorker.register("/sw.js");
      } catch (error) {
        console.error("Service worker registration failed:", error);
      }
    };

    register();
  }, []);

  return null;
}