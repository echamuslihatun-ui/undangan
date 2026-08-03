"use client";

import { useMemo, useRef, useState } from "react";
import Image from "next/image";
import {
  motion,
  useScroll,
  useTransform,
  useSpring,
  AnimatePresence,
} from "framer-motion";
import {
  Calendar,
  Clock,
  Copy,
  Check,
  MapPin,
  Instagram,
  ChevronDown,
  Heart,
  Gift,
  Camera,
  ScrollText,
  Music,
  Music2,
  X,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import type { WeddingData, StoryItem } from "./types";
import { storyPeriod } from "./types";

/* ============================================================
   Utilitas normalisasi data (photos/bankAccounts/story bisa
   berupa array atau string JSON dari database).
   ============================================================ */
function parseArray<T>(value: unknown): T[] {
  if (Array.isArray(value)) return value as T[];
  if (typeof value === "string" && value.trim()) {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed) ? (parsed as T[]) : [];
    } catch {
      return [];
    }
  }
  return [];
}

const HERO_FALLBACK =
  "https://images.unsplash.com/photo-1519741497674-611481863552?w=1920&q=80";

/* ============================================================
   Sub-komponen dekoratif (di-inline agar theme mandiri).
   ============================================================ */
const PETAL_COLORS = ["#f5ede0", "#e0c9a0", "#c9a96e", "#fdf8f0", "#d4b888"];

function FloatingPetals({ count = 12 }: { count?: number }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: Math.random() * 100,
        size: 8 + Math.random() * 14,
        duration: 8 + Math.random() * 12,
        delay: Math.random() * 10,
        drift: (Math.random() - 0.5) * 200,
        rotate: Math.random() * 360,
        opacity: 0.3 + Math.random() * 0.5,
        color: PETAL_COLORS[i % PETAL_COLORS.length],
      })),
    [count]
  );

  return (
    <div className="pointer-events-none fixed inset-0 z-30 overflow-hidden">
      {petals.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: -50, x: `${p.x}vw`, opacity: 0, rotate: 0 }}
          animate={{
            y: "110vh",
            x: `calc(${p.x}vw + ${p.drift}px)`,
            opacity: [0, p.opacity, p.opacity, 0],
            rotate: p.rotate,
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "linear",
          }}
          style={{
            position: "absolute",
            width: p.size,
            height: p.size,
            borderRadius: "50% 0 50% 50%",
            background: p.color,
            boxShadow: `0 0 4px ${p.color}`,
          }}
        />
      ))}
    </div>
  );
}

function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });
  return (
    <motion.div
      style={{ scaleX }}
      className="fixed left-0 right-0 top-0 z-50 h-1 origin-left bg-gradient-to-r from-[#c9a96e] via-[#e0c9a0] to-[#c9a96e]"
    />
  );
}

function MusicToggle({ musicUrl }: { musicUrl?: string | null }) {
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
      audioRef.current.play().catch(() => {});
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
      className="fixed bottom-24 right-5 z-50 flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-b from-[#5c4a32] to-[#3d2f1f] text-[#c9a96e] shadow-xl sm:h-14 sm:w-14"
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

function Lightbox({
  photos,
  index,
  onClose,
  onNavigate,
}: {
  photos: string[];
  index: number | null;
  onClose: () => void;
  onNavigate: (i: number) => void;
}) {
  if (index === null) return null;
  const prev = () => onNavigate((index - 1 + photos.length) % photos.length);
  const next = () => onNavigate((index + 1) % photos.length);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[60] flex items-center justify-center bg-black/90 p-4"
        onClick={onClose}
      >
        <button
          onClick={onClose}
          className="absolute right-5 top-5 text-white/80 transition hover:text-white"
          aria-label="Tutup"
        >
          <X className="h-7 w-7" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            prev();
          }}
          className="absolute left-4 text-white/70 transition hover:text-white"
          aria-label="Sebelumnya"
        >
          <ChevronLeft className="h-9 w-9" />
        </button>
        <motion.div
          key={index}
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="relative h-[80vh] w-full max-w-4xl"
          onClick={(e) => e.stopPropagation()}
        >
          <Image
            src={photos[index]}
            alt={`Foto ${index + 1}`}
            fill
            sizes="100vw"
            className="object-contain"
          />
        </motion.div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            next();
          }}
          className="absolute right-4 text-white/70 transition hover:text-white"
          aria-label="Selanjutnya"
        >
          <ChevronRight className="h-9 w-9" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 60 },
  visible: { opacity: 1, y: 0 },
};

function SectionHeading({
  icon: Icon,
  title,
  subtitle,
}: {
  icon: React.ElementType;
  title: string;
  subtitle: string;
}) {
  return (
    <motion.div
      variants={{ hidden: { opacity: 0, y: 40 }, visible: { opacity: 1, y: 0 } }}
      initial="hidden"
      whileInView="visible"
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="mb-12 text-center"
    >
      <motion.div
        animate={{ rotate: [0, 5, -5, 0] }}
        transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
        className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#c9a96e]/40 bg-[#c9a96e]/10"
      >
        <Icon className="h-6 w-6 text-[#c9a96e]" />
      </motion.div>
      <h2 className="font-playfair text-3xl font-semibold text-[#5c4a32] sm:text-4xl md:text-5xl">
        {title}
      </h2>
      <div className="ornament-line mx-auto mt-3 max-w-xs">
        <span className="font-serif-display text-sm italic text-[#8b7355]">
          {subtitle}
        </span>
      </div>
    </motion.div>
  );
}

function formatDateID(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function formatTimeID(value?: string | null) {
  if (!value) return null;
  return new Date(value).toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

/**
 * Rangkai label jam acara dari jam mulai & selesai yang kini berdiri sendiri
 * (format "HH:MM"). Bila keduanya kosong, jatuh kembali ke jam yang mungkin
 * masih menempel pada nilai tanggal (data lama).
 */
function formatEventTime(
  start?: string | null,
  end?: string | null,
  fallbackDate?: string | null
) {
  if (start && end) return `${start} - ${end} WIB`;
  if (start) return `${start} WIB`;
  const fromDate = fallbackDate ? formatTimeID(fallbackDate) : null;
  // Data lama tanpa jam tersimpan sebagai 00.00; jangan tampilkan jam palsu.
  if (fromDate && fromDate !== "00.00" && fromDate !== "00:00") {
    return `${fromDate} WIB`;
  }
  return null;
}

/* ============================================================
   Theme utama.
   ============================================================ */
export default function ElegantTheme({ wedding }: { wedding: WeddingData }) {
  const photos = parseArray<string>(wedding.photos);
  const bankAccounts = parseArray<{
    bank: string;
    account: string;
    holder: string;
  }>(wedding.bankAccounts);
  const story = parseArray<StoryItem>(wedding.story);
  const eventDate = wedding.resepsiDate || wedding.akadDate || null;
  // Gambar cover kini bisa diatur sendiri di dashboard; galeri hanya cadangan.
  const heroImage = wedding.heroImage || photos[0] || HERO_FALLBACK;
  const akadTime = formatEventTime(wedding.akadStart, wedding.akadEnd, wedding.akadDate);
  const resepsiTime = formatEventTime(
    wedding.resepsiStart,
    wedding.resepsiEnd,
    wedding.resepsiDate
  );
  // Tempat & peta per acara, dengan lokasi umum sebagai cadangan.
  const akadVenue = wedding.akadVenue || wedding.location;
  const akadMapsUrl = wedding.akadMapsUrl || wedding.mapsUrl;
  const resepsiVenue = wedding.resepsiVenue || wedding.location;
  const resepsiMapsUrl = wedding.resepsiMapsUrl || wedding.mapsUrl;
  // Blok lokasi umum hanya perlu tampil bila tiap acara belum punya tempat sendiri.
  const showGeneralLocation =
    !!wedding.location && !wedding.akadVenue && !wedding.resepsiVenue;

  const [lightboxIndex, setLightboxIndex] = useState<number | null>(null);
  const [copied, setCopied] = useState<string | null>(null);

  const copyAccount = (value: string) => {
    navigator.clipboard.writeText(value);
    setCopied(value);
    setTimeout(() => setCopied(null), 2000);
  };

  const { scrollY } = useScroll();
  const heroY = useTransform(scrollY, [0, 600], [0, 150]);
  const heroOpacity = useTransform(scrollY, [0, 400], [1, 0]);
  const heroScale = useTransform(scrollY, [0, 600], [1, 1.15]);

  const hasGift =
    (wedding.bankName && wedding.bankAccount) ||
    bankAccounts.length > 0 ||
    wedding.qrisImage;

  return (
    <div className="relative min-h-screen bg-[#fdf8f0]">
      <ScrollProgress />
      <FloatingPetals count={12} />
      <MusicToggle musicUrl={wedding.musicUrl} />

      {/* ============ HERO ============ */}
      <section className="relative flex h-screen min-h-[600px] items-center justify-center overflow-hidden">
        <motion.div style={{ y: heroY, scale: heroScale }} className="absolute inset-0">
          <Image
            src={heroImage}
            alt="Cover"
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#3d2f1f]/50 via-[#3d2f1f]/30 to-[#3d2f1f]/70" />
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity }}
          className="relative z-10 px-6 text-center text-[#fdf8f0]"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="mb-3 text-sm uppercase tracking-[0.3em] text-[#e0c9a0] sm:text-base"
          >
            The Wedding Of
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 1, type: "spring", stiffness: 100 }}
            className="font-display text-5xl leading-tight text-shadow-lg sm:text-7xl md:text-8xl"
          >
            {wedding.nickname1 || wedding.partner1}
            <span className="mx-3 align-middle font-serif-display text-3xl text-[#c9a96e] sm:text-5xl">
              &
            </span>
            {wedding.nickname2 || wedding.partner2}
          </motion.h1>

          {eventDate && (
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="mt-4 font-serif-display text-lg text-[#e0c9a0] sm:text-xl"
            >
              {formatDateID(eventDate)}
            </motion.p>
          )}
        </motion.div>

        <motion.div
          style={{ opacity: heroOpacity }}
          animate={{ y: [0, 12, 0] }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="absolute bottom-8 left-1/2 z-10 -translate-x-1/2 text-[#e0c9a0]"
        >
          <ChevronDown className="h-7 w-7" />
        </motion.div>
      </section>

      {/* ============ QUOTE ============ */}
      {wedding.quote && (
        <section className="relative overflow-hidden bg-[#5c4a32] py-24 sm:py-32">
          {/* Latar kutipan opsional; tanpa gambar tetap memakai warna solid. */}
          {wedding.quoteImage && (
            <div className="absolute inset-0">
              <Image
                src={wedding.quoteImage}
                alt=""
                aria-hidden
                fill
                sizes="100vw"
                className="object-cover"
              />
              <div className="absolute inset-0 bg-[#3d2f1f]/75" />
            </div>
          )}
          <motion.div
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8 }}
            className="relative z-10 mx-auto max-w-3xl px-6 text-center"
          >
            <Heart className="mx-auto mb-6 h-10 w-10 fill-[#c9a96e] text-[#c9a96e]" />
            <p className="font-serif-display text-lg italic leading-relaxed text-[#fdf8f0]/90 sm:text-xl md:text-2xl">
              {wedding.quote}
            </p>
            {wedding.quoteSource && (
              <p className="mt-6 text-xs uppercase tracking-[0.25em] text-[#c9a96e]">
                {wedding.quoteSource}
              </p>
            )}
          </motion.div>
        </section>
      )}

      {/* ============ MEMPELAI ============ */}
      <section className="bg-grain bg-[#fdf8f0] py-24 sm:py-32">
        <div className="mx-auto max-w-5xl px-6">
          <SectionHeading icon={Heart} title="Mempelai" subtitle="Dua hati menjadi satu" />

          <div className="flex flex-col items-center justify-center gap-12 md:flex-row md:gap-20">
            {/* Mempelai Pria */}
            <div className="flex flex-col items-center text-center">
              {wedding.photoPria && (
                <div className="relative mb-5 h-36 w-36 overflow-hidden rounded-full border-2 border-[#c9a96e]/50 shadow-md sm:h-44 sm:w-44">
                  <Image
                    src={wedding.photoPria}
                    alt={wedding.partner1 || "Mempelai Pria"}
                    fill
                    sizes="176px"
                    className="object-cover"
                  />
                </div>
              )}
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[#8b7355]">
                Mempelai Pria
              </p>
              <h3 className="font-playfair text-2xl font-semibold text-[#5c4a32] sm:text-3xl">
                {wedding.partner1}
              </h3>
              <div className="mt-4 text-sm text-[#5c4a32]/70">
                {wedding.fatherPria || wedding.motherPria ? (
                  <>
                    <p className="font-serif-display text-base text-[#5c4a32]">
                      {wedding.fatherPria || "Bapak"}
                    </p>
                    <p className="my-1 text-[#c9a96e]">&</p>
                    <p className="font-serif-display text-base text-[#5c4a32]">
                      {wedding.motherPria || "Ibu"}
                    </p>
                  </>
                ) : (
                  <p className="font-serif-display text-base text-[#5c4a32]">
                    {wedding.parent1 || "Putra dari Bapak & Ibu"}
                  </p>
                )}
              </div>
              {wedding.instagram1 && (
                <a
                  href={`https://instagram.com/${wedding.instagram1}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-1.5 text-sm text-[#8b7355] transition hover:text-[#c9a96e]"
                >
                  <Instagram className="h-4 w-4" />@{wedding.instagram1}
                </a>
              )}
            </div>

            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="flex h-16 w-16 items-center justify-center rounded-full border border-[#c9a96e]/30"
            >
              <span className="font-display text-3xl text-[#c9a96e]">&</span>
            </motion.div>

            {/* Mempelai Wanita */}
            <div className="flex flex-col items-center text-center">
              {wedding.photoWanita && (
                <div className="relative mb-5 h-36 w-36 overflow-hidden rounded-full border-2 border-[#c9a96e]/50 shadow-md sm:h-44 sm:w-44">
                  <Image
                    src={wedding.photoWanita}
                    alt={wedding.partner2 || "Mempelai Wanita"}
                    fill
                    sizes="176px"
                    className="object-cover"
                  />
                </div>
              )}
              <p className="mb-1 text-xs uppercase tracking-[0.2em] text-[#8b7355]">
                Mempelai Wanita
              </p>
              <h3 className="font-playfair text-2xl font-semibold text-[#5c4a32] sm:text-3xl">
                {wedding.partner2}
              </h3>
              <div className="mt-4 text-sm text-[#5c4a32]/70">
                {wedding.fatherWanita || wedding.motherWanita ? (
                  <>
                    <p className="font-serif-display text-base text-[#5c4a32]">
                      {wedding.fatherWanita || "Bapak"}
                    </p>
                    <p className="my-1 text-[#c9a96e]">&</p>
                    <p className="font-serif-display text-base text-[#5c4a32]">
                      {wedding.motherWanita || "Ibu"}
                    </p>
                  </>
                ) : (
                  <p className="font-serif-display text-base text-[#5c4a32]">
                    {wedding.parent2 || "Putri dari Bapak & Ibu"}
                  </p>
                )}
              </div>
              {wedding.instagram2 && (
                <a
                  href={`https://instagram.com/${wedding.instagram2}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-4 flex items-center gap-1.5 text-sm text-[#8b7355] transition hover:text-[#c9a96e]"
                >
                  <Instagram className="h-4 w-4" />@{wedding.instagram2}
                </a>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ============ SAVE THE DATE ============ */}
      <section className="relative overflow-hidden bg-[#f5ede0] py-24 sm:py-32">
        <div className="mx-auto max-w-4xl px-6">
          <SectionHeading icon={Calendar} title="Save the Date" subtitle="Rangkaian acara" />

          {eventDate && (
            <div className="mb-16">
              <p className="mb-4 text-center text-xs uppercase tracking-[0.3em] text-[#8b7355]">
                Menuju Hari Bahagia
              </p>
              <CountdownTimer targetDate={eventDate} />
            </div>
          )}

          <div className="grid gap-6 md:grid-cols-2">
            {wedding.akadDate && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6 }}
                whileHover={{ y: -6 }}
                className="rounded-2xl border border-[#e8d9c0] bg-white/70 p-7 shadow-sm backdrop-blur-sm"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c9a96e]/15">
                    <Calendar className="h-5 w-5 text-[#c9a96e]" />
                  </div>
                  <h3 className="font-playfair text-2xl font-semibold text-[#5c4a32]">
                    Akad Nikah
                  </h3>
                </div>
                <p className="mb-1 font-serif-display text-lg text-[#5c4a32]">
                  {formatDateID(wedding.akadDate)}
                </p>
                {akadTime && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-[#8b7355]">
                    <Clock className="h-4 w-4" />
                    {akadTime}
                  </div>
                )}
                {akadVenue && (
                  <div className="flex items-start gap-2 text-sm text-[#5c4a32]/80">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a96e]" />
                    <span>{akadVenue}</span>
                  </div>
                )}
                {akadMapsUrl && (
                  <a
                    href={akadMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#c9a96e] px-4 py-2 text-sm font-medium text-[#5c4a32] transition hover:bg-[#c9a96e] hover:text-[#fdf8f0]"
                  >
                    <MapPin className="h-4 w-4" />
                    Lihat Lokasi
                  </a>
                )}
              </motion.div>
            )}

            {wedding.resepsiDate && (
              <motion.div
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true, amount: 0.2 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                whileHover={{ y: -6 }}
                className="rounded-2xl border border-[#e8d9c0] bg-white/70 p-7 shadow-sm backdrop-blur-sm"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#c9a96e]/15">
                    <Calendar className="h-5 w-5 text-[#c9a96e]" />
                  </div>
                  <h3 className="font-playfair text-2xl font-semibold text-[#5c4a32]">
                    Resepsi
                  </h3>
                </div>
                <p className="mb-1 font-serif-display text-lg text-[#5c4a32]">
                  {formatDateID(wedding.resepsiDate)}
                </p>
                {resepsiTime && (
                  <div className="mb-3 flex items-center gap-2 text-sm text-[#8b7355]">
                    <Clock className="h-4 w-4" />
                    {resepsiTime}
                  </div>
                )}
                {resepsiVenue && (
                  <div className="flex items-start gap-2 text-sm text-[#5c4a32]/80">
                    <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-[#c9a96e]" />
                    <span>{resepsiVenue}</span>
                  </div>
                )}
                {resepsiMapsUrl && (
                  <a
                    href={resepsiMapsUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="mt-4 inline-flex items-center gap-2 rounded-lg border border-[#c9a96e] px-4 py-2 text-sm font-medium text-[#5c4a32] transition hover:bg-[#c9a96e] hover:text-[#fdf8f0]"
                  >
                    <MapPin className="h-4 w-4" />
                    Lihat Lokasi
                  </a>
                )}
              </motion.div>
            )}
          </div>

          {showGeneralLocation && (
            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.2 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="mt-6 rounded-2xl border border-[#e8d9c0] bg-white/70 p-6 text-center shadow-sm backdrop-blur-sm"
            >
              <div className="mb-4 flex items-center justify-center gap-2 text-[#5c4a32]/80">
                <MapPin className="h-4 w-4 shrink-0 text-[#c9a96e]" />
                <span>{wedding.location}</span>
              </div>
              {wedding.mapsUrl && (
                <a
                  href={wedding.mapsUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-lg border border-[#c9a96e] px-4 py-2 text-sm font-medium text-[#5c4a32] transition hover:bg-[#c9a96e] hover:text-[#fdf8f0]"
                >
                  <MapPin className="h-4 w-4" />
                  Lihat Lokasi
                </a>
              )}
            </motion.div>
          )}
        </div>
      </section>

      {/* ============ CERITA CINTA (opsional) ============ */}
      {wedding.storyEnabled && story.length > 0 && (
        <section className="bg-grain bg-[#fdf8f0] py-24 sm:py-32">
          <div className="mx-auto max-w-3xl px-6">
            <SectionHeading
              icon={ScrollText}
              title="Cerita Cinta"
              subtitle="Perjalanan kami"
            />

            <div className="relative">
              <div className="absolute left-4 top-0 h-full w-px bg-gradient-to-b from-[#c9a96e] via-[#c9a96e]/40 to-transparent md:left-1/2" />

              {story.map((item, i) => (
                <motion.div
                  key={i}
                  variants={fadeUp}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true, amount: 0.4 }}
                  transition={{ duration: 0.6, delay: 0.1 }}
                  className={`relative mb-12 flex flex-col gap-4 pl-14 md:pl-0 ${
                    i % 2 === 0
                      ? "md:flex-row md:items-start"
                      : "md:flex-row-reverse md:items-start"
                  }`}
                >
                  <div className="md:w-1/2" />
                  <div
                    className={`md:w-1/2 ${
                      i % 2 === 0 ? "md:pr-12 md:text-right" : "md:pl-12"
                    }`}
                  >
                    <div className="absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-[#c9a96e] bg-[#fdf8f0] md:left-1/2 md:-translate-x-1/2">
                      <Heart className="h-3 w-3 fill-[#c9a96e] text-[#c9a96e]" />
                    </div>
                    <span className="font-display text-3xl text-[#c9a96e]">
                      {storyPeriod(item)}
                    </span>
                    <h3 className="mb-2 font-playfair text-xl font-semibold text-[#5c4a32]">
                      {item.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-[#5c4a32]/70">
                      {item.description}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ============ GALERI ============ */}
      {photos.length > 0 && (
        <section className="bg-[#f5ede0] py-24 sm:py-32">
          <div className="mx-auto max-w-5xl px-6">
            <SectionHeading icon={Camera} title="Galeri" subtitle="Momen indah kami" />

            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {photos.map((src, i) => (
                <motion.button
                  key={i}
                  onClick={() => setLightboxIndex(i)}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{ duration: 0.5, delay: (i % 3) * 0.1 }}
                  whileHover={{ scale: 1.03 }}
                  className="group relative aspect-square overflow-hidden rounded-xl shadow-md"
                >
                  <Image
                    src={src}
                    alt={`Foto ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 50vw, 33vw"
                    className="object-cover transition duration-500 group-hover:brightness-110"
                  />
                </motion.button>
              ))}
            </div>
          </div>

          <Lightbox
            photos={photos}
            index={lightboxIndex}
            onClose={() => setLightboxIndex(null)}
            onNavigate={setLightboxIndex}
          />
        </section>
      )}

      {/* ============ PESAN ============ */}
      {wedding.message && (
        <section className="bg-grain bg-[#fdf8f0] py-20 text-center">
          <motion.p
            variants={fadeUp}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7 }}
            className="mx-auto max-w-2xl px-6 font-serif-display text-lg italic leading-relaxed text-[#5c4a32]/80"
          >
            &ldquo;{wedding.message}&rdquo;
          </motion.p>
        </section>
      )}

      {/* ============ HADIAH ============ */}
      {hasGift && (
        <section className="bg-grain bg-[#fdf8f0] py-24 sm:py-32">
          <div className="mx-auto max-w-2xl px-6">
            <SectionHeading icon={Gift} title="Hadiah" subtitle="Tanda kasih" />

            <motion.div
              variants={fadeUp}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.7 }}
              className="space-y-4"
            >
              <p className="mb-6 text-center text-sm text-[#5c4a32]/70">
                Doa restu Anda adalah hadiah terindah. Namun jika ingin memberi tanda
                kasih, dapat melalui:
              </p>

              {/* Legacy single account */}
              {wedding.bankName && wedding.bankAccount && (
                <div className="rounded-2xl border border-[#e8d9c0] bg-white/70 p-8 text-center shadow-sm backdrop-blur-sm">
                  <div className="mb-2 inline-block rounded-lg bg-[#5c4a32] px-6 py-2 text-sm font-medium text-[#c9a96e]">
                    {wedding.bankName}
                  </div>
                  <p className="mb-1 font-playfair text-2xl tracking-wider text-[#5c4a32]">
                    {wedding.bankAccount}
                  </p>
                  {wedding.bankHolder && (
                    <p className="mb-6 text-sm text-[#8b7355]">
                      a.n. {wedding.bankHolder}
                    </p>
                  )}
                  <button
                    onClick={() => copyAccount(wedding.bankAccount!)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#c9a96e] px-5 py-2.5 text-sm font-medium text-[#5c4a32] transition hover:bg-[#c9a96e] hover:text-[#fdf8f0]"
                  >
                    {copied === wedding.bankAccount ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied === wedding.bankAccount ? "Tersalin!" : "Salin Nomor"}
                  </button>
                </div>
              )}

              {/* Multi rekening */}
              {bankAccounts.map((acc, i) => (
                <div
                  key={i}
                  className="rounded-2xl border border-[#e8d9c0] bg-white/70 p-8 text-center shadow-sm backdrop-blur-sm"
                >
                  <div className="mb-2 inline-block rounded-lg bg-[#5c4a32] px-6 py-2 text-sm font-medium text-[#c9a96e]">
                    {acc.bank}
                  </div>
                  <p className="mb-1 font-playfair text-2xl tracking-wider text-[#5c4a32]">
                    {acc.account}
                  </p>
                  {acc.holder && (
                    <p className="mb-6 text-sm text-[#8b7355]">a.n. {acc.holder}</p>
                  )}
                  <button
                    onClick={() => copyAccount(acc.account)}
                    className="inline-flex items-center gap-2 rounded-lg border border-[#c9a96e] px-5 py-2.5 text-sm font-medium text-[#5c4a32] transition hover:bg-[#c9a96e] hover:text-[#fdf8f0]"
                  >
                    {copied === acc.account ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                    {copied === acc.account ? "Tersalin!" : "Salin Nomor"}
                  </button>
                </div>
              ))}

              {/* QRIS */}
              {wedding.qrisImage && (
                <div className="rounded-2xl border border-[#e8d9c0] bg-white/70 p-8 text-center shadow-sm backdrop-blur-sm">
                  <p className="mb-4 font-playfair text-xl font-semibold text-[#5c4a32]">
                    QRIS
                  </p>
                  <div className="relative mx-auto h-48 w-48 overflow-hidden rounded-lg">
                    <Image
                      src={wedding.qrisImage}
                      alt="QRIS"
                      fill
                      sizes="192px"
                      className="object-contain"
                    />
                  </div>
                </div>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* ============ FOOTER ============ */}
      <footer className="relative overflow-hidden bg-[#3d2f1f] py-20 text-center">
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="relative z-10 mx-auto max-w-2xl px-6"
        >
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-[#c9a96e]/30"
          >
            <Heart className="h-7 w-7 fill-[#c9a96e] text-[#c9a96e]" />
          </motion.div>

          <p className="mb-4 font-display text-4xl text-[#c9a96e] sm:text-5xl">
            {wedding.nickname1 || wedding.partner1} &amp;{" "}
            {wedding.nickname2 || wedding.partner2}
          </p>

          <p className="mb-8 font-serif-display text-base text-[#fdf8f0]/80">
            Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila
            Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu kepada kedua
            mempelai.
          </p>

          <div className="ornament-line mx-auto mb-6 max-w-xs">
            <span className="font-serif-display text-sm italic text-[#c9a96e]">
              Wassalamu&apos;alaikum Wr. Wb.
            </span>
          </div>

          <p className="text-xs uppercase tracking-[0.2em] text-[#8b7355]">
            Kami yang berbahagia
          </p>
          <p className="mt-2 font-serif-display text-lg text-[#fdf8f0]">
            Keluarga Besar Mempelai
          </p>
        </motion.div>
      </footer>
    </div>
  );
}
