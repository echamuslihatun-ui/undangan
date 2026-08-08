import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Undanganku - Undangan Online Pernikahan",
    short_name: "Undanganku",
    description:
      "Buat undangan pernikahan digital yang elegan. Pilih template, kustomisasi, bayar, dan sebar undangan via WhatsApp.",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#d4af37",
    lang: "id",
    categories: ["lifestyle", "social"],
    icons: [
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "any",
      },
      {
        src: "/icon.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}