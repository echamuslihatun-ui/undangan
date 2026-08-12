"use client";

import { motion } from "framer-motion";
import { Video, ExternalLink } from "lucide-react";

/**
 * Section Live Streaming untuk undangan digital.
 * Mendukung embed YouTube, Zoom, Google Meet, dan link eksternal lainnya.
 * Digunakan oleh semua theme (Classic, Modern, Elegant).
 */
export default function LiveStreamSection({ liveStreamUrl }: { liveStreamUrl?: string | null }) {
  if (!liveStreamUrl) return null;

  // Deteksi platform dari URL
  const isYouTube = /youtube\.com|youtu\.be/.test(liveStreamUrl);
  const isZoom = /zoom\.us/.test(liveStreamUrl);
  const isMeet = /meet\.google\.com/.test(liveStreamUrl);

  // Untuk YouTube, kita bisa embed langsung; platform lain pakai link eksternal
  const getEmbedUrl = (url: string) => {
    if (isYouTube) {
      // Konversi berbagai format YouTube ke embed URL
      const videoId = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      return videoId ? `https://www.youtube.com/embed/${videoId}` : null;
    }
    return null;
  };

  const embedUrl = getEmbedUrl(liveStreamUrl);

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.7 }}
      className="px-8 py-10"
    >
      <div className="text-center">
        <motion.div
          initial={{ scale: 0 }}
          whileInView={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-[#5c4a32]/10"
        >
          <Video className="h-6 w-6 text-[#5c4a32]" />
        </motion.div>
        <h3 className="text-xl font-bold text-[#5c4a32]">Live Streaming</h3>
        <p className="mt-2 text-sm text-[#8b7355]">
          Saksikan acara secara virtual melalui tautan berikut
        </p>
      </div>

      <div className="mt-6">
        {embedUrl ? (
          <div className="relative aspect-video w-full overflow-hidden rounded-xl shadow-lg">
            <iframe
              src={embedUrl}
              title="Live Streaming"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="absolute inset-0 h-full w-full"
            />
          </div>
        ) : (
          <motion.a
            href={liveStreamUrl}
            target="_blank"
            rel="noopener noreferrer"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center justify-center gap-3 rounded-xl border border-[#e8d9c0] bg-white/70 p-6 text-[#5c4a32] shadow-sm transition hover:bg-[#f5ede0]"
          >
            <ExternalLink className="h-5 w-5" />
            <span className="font-medium">
              {isZoom && "Buka Zoom Meeting"}
              {isMeet && "Buka Google Meet"}
              {!isZoom && !isMeet && "Buka Live Streaming"}
            </span>
          </motion.a>
        )}
      </div>
    </motion.section>
  );
}
