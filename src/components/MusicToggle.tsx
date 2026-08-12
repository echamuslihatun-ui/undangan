"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Music2 } from "lucide-react";

/**
 * Floating music toggle button untuk theme undangan.
 * Menangani autoplay-blocking browser dengan play/pause manual.
 * Digunakan oleh semua theme (Classic, Modern, Elegant).
 */
export default function MusicToggle({ musicUrl }: { musicUrl?: string | null }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const toggle = () => {
    if (!musicUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(musicUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }
    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play().catch(() => {
        // Autoplay blocked, user needs to interact first
      });
    }
    setIsPlaying(!isPlaying);
  };

  if (!musicUrl) return null;

  return (
    <motion.button
      onClick={toggle}
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ delay: 1, type: "spring", stiffness: 200, damping: 15 }}
      whileHover={{ scale: 1.1 }}
      whileTap={{ scale: 0.9 }}
      className="fixed bottom-6 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-[#5c4a32] to-[#3d2f1f] text-[#c9a96e] shadow-xl sm:h-14 sm:w-14"
      aria-label={isPlaying ? "Pause music" : "Play music"}
    >
      <AnimatePresence mode="wait">
        {isPlaying ? (
          <motion.div
            key="playing"
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: 180, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Music2 className="h-5 w-5 sm:h-6 sm:w-6" />
          </motion.div>
        ) : (
          <motion.div
            key="paused"
            initial={{ rotate: 180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            exit={{ rotate: -180, opacity: 0 }}
            transition={{ duration: 0.3 }}
          >
            <Music className="h-5 w-5 sm:h-6 sm:w-6" />
          </motion.div>
        )}
      </AnimatePresence>
      {isPlaying && (
        <motion.span
          className="absolute inset-0 rounded-full border-2 border-[#c9a96e]"
          animate={{ scale: [1, 1.4], opacity: [0.6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeOut" }}
        />
      )}
    </motion.button>
  );
}
