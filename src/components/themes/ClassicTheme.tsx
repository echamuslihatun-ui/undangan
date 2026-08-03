"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import type { Variants } from "framer-motion";
import { Heart, Calendar, MapPin, Clock } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import type { WeddingData } from "./types";

const fadeUp: Variants = {

  hidden: { opacity: 0, y: 40 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.25, 0.1, 0.25, 1] } },
};

const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.8 } },
};

const COVER_FALLBACK =
  "https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=800";

/** Label jam acara dari jam mulai/selesai yang kini tersimpan terpisah. */
function eventTimeLabel(start?: string | null, end?: string | null) {
  if (start && end) return `${start} - ${end} WIB`;
  if (start) return `${start} WIB`;
  return null;
}

function dateLabel(value: string) {
  return new Date(value).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export default function ClassicTheme({ wedding }: { wedding: WeddingData }) {
  const eventDate = wedding.resepsiDate || wedding.akadDate;
  const photos = Array.isArray(wedding.photos) ? wedding.photos : (wedding.photos ? JSON.parse(wedding.photos) : []);
  const bankAccounts = Array.isArray(wedding.bankAccounts) ? wedding.bankAccounts : (wedding.bankAccounts ? JSON.parse(wedding.bankAccounts) : []);
  const { scrollY } = useScroll();
  const yParallax = useTransform(scrollY, [0, 600], [0, -150]);
  const audioRef = useRef<HTMLAudioElement>(null);
  // Cover mengikuti pengaturan dashboard; galeri lalu gambar contoh sebagai cadangan.
  const coverImage = wedding.heroImage || photos[0] || COVER_FALLBACK;
  const akadTime = eventTimeLabel(wedding.akadStart, wedding.akadEnd);
  const resepsiTime = eventTimeLabel(wedding.resepsiStart, wedding.resepsiEnd);
  const akadVenue = wedding.akadVenue || wedding.location;
  const resepsiVenue = wedding.resepsiVenue || wedding.location;
  // Lokasi umum hanya ditampilkan bila tiap acara belum punya tempat sendiri.
  const showGeneralLocation =
    !!wedding.location && !wedding.akadVenue && !wedding.resepsiVenue;

  useEffect(() => {
    if (wedding.musicUrl && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Autoplay blocked, user needs to interact first
      });
    }
  }, [wedding.musicUrl]);

  return (
    <div className="overflow-hidden rounded-2xl bg-[#fdf8f0] shadow-xl font-serif">
      {/* Cover dengan Parallax Effect */}
      <motion.div style={{ y: yParallax }} className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={coverImage}
          alt="Cover"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/50 to-black/80" />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: "easeOut" }}
          className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center text-white"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xs tracking-[0.3em] uppercase opacity-80"
          >
            The Wedding Of
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-3 text-4xl font-bold md:text-5xl"
          >
            {wedding.partner1} & {wedding.partner2}
          </motion.h2>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="mt-4 flex items-center gap-2 text-sm opacity-90"
          >
            <Heart className="h-3 w-3" fill="currentColor" />
            <span>
              {eventDate
                ? new Date(eventDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
                : "24 Agustus 2026"}
            </span>
            <Heart className="h-3 w-3" fill="currentColor" />
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Bismillah / Pembuka */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="px-8 py-10 text-center border-b border-[#e8d9c0]"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-sm text-[#8b7355]"
        >
          Assalamualaikum Wr. Wb.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="mt-3 text-sm leading-relaxed text-[#6b5c45]"
        >
          Dengan memohon rahmat dan ridho Allah SWT, kami mengundang Bapak/Ibu/Saudara/i untuk menghadiri acara pernikahan kami:
        </motion.p>
      </motion.div>

      {/* Nama Mempelai */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="px-8 py-10 text-center"
      >
        <div className="space-y-4">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h3 className="text-3xl font-bold text-[#5c4a32]">{wedding.partner1}</h3>
            <p className="mt-1 text-sm text-[#8b7355]">
              {wedding.fatherPria || wedding.motherPria
                ? `Putra dari ${wedding.fatherPria || "Bapak"}${wedding.fatherPria && wedding.motherPria ? " & " : ""}${wedding.motherPria || "Ibu"}`
                : wedding.parent1 || "Putra dari Bapak & Ibu"}
            </p>
          </motion.div>
          <motion.div
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            transition={{ delay: 0.4, duration: 0.5, type: "spring" }}
            className="text-4xl text-[#c9a96e]"
          >
            &
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h3 className="text-3xl font-bold text-[#5c4a32]">{wedding.partner2}</h3>
            <p className="mt-1 text-sm text-[#8b7355]">
              {wedding.fatherWanita || wedding.motherWanita
                ? `Putri dari ${wedding.fatherWanita || "Bapak"}${wedding.fatherWanita && wedding.motherWanita ? " & " : ""}${wedding.motherWanita || "Ibu"}`
                : wedding.parent2 || "Putri dari Bapak & Ibu"}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Rangkaian Acara */}
      <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="bg-[#f5ede0] px-8 py-10"
      >
        <motion.h3
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center text-xl font-bold text-[#5c4a32]"
        >
          Rangkaian Acara
        </motion.h3>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {wedding.akadDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              className="rounded-lg bg-white p-4 text-center shadow-sm border border-[#e8d9c0] cursor-pointer"
            >
              <h4 className="font-semibold text-[#5c4a32]">Akad Nikah</h4>
              {akadTime && (
                <div className="mt-2 flex items-center justify-center gap-2 text-sm text-[#8b7355]">
                  <Clock className="h-4 w-4" /> {akadTime}
                </div>
              )}
              <div className="mt-1 flex items-center justify-center gap-2 text-sm text-[#8b7355]">
                <Calendar className="h-4 w-4" />
                {dateLabel(wedding.akadDate)}
              </div>
              {akadVenue && (
                <div className="mt-1 flex items-center justify-center gap-2 text-sm text-[#8b7355]">
                  <MapPin className="h-4 w-4 shrink-0" /> {akadVenue}
                </div>
              )}
            </motion.div>
          )}
          {wedding.resepsiDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              className="rounded-lg bg-white p-4 text-center shadow-sm border border-[#e8d9c0] cursor-pointer"
            >
              <h4 className="font-semibold text-[#5c4a32]">Resepsi</h4>
              {resepsiTime && (
                <div className="mt-2 flex items-center justify-center gap-2 text-sm text-[#8b7355]">
                  <Clock className="h-4 w-4" /> {resepsiTime}
                </div>
              )}
              <div className="mt-1 flex items-center justify-center gap-2 text-sm text-[#8b7355]">
                <Calendar className="h-4 w-4" />
                {dateLabel(wedding.resepsiDate)}
              </div>
              {resepsiVenue && (
                <div className="mt-1 flex items-center justify-center gap-2 text-sm text-[#8b7355]">
                  <MapPin className="h-4 w-4 shrink-0" /> {resepsiVenue}
                </div>
              )}
            </motion.div>
          )}
        </div>
        {showGeneralLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className="mt-4 rounded-lg bg-white p-4 text-center shadow-sm border border-[#e8d9c0] cursor-pointer"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-[#8b7355]">
              <MapPin className="h-4 w-4" /> {wedding.location}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Countdown */}
      {eventDate && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="px-8 py-10"
        >
          <CountdownTimer targetDate={eventDate} />
        </motion.div>
      )}

      {/* Galeri Foto */}
      {photos.length > 0 && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="bg-[#f5ede0] px-8 py-10"
        >
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center text-xl font-bold text-[#5c4a32]"
          >
            Galeri Foto
          </motion.h3>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo: string, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
                className="relative aspect-square overflow-hidden rounded-lg cursor-pointer"
              >
                <Image src={photo} alt={`Foto ${i + 1}`} fill className="object-cover" />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Musik Background - Autoplay Hidden */}
      {wedding.musicUrl && (
        <div className="hidden">
          <audio ref={audioRef} src={wedding.musicUrl} autoPlay loop />
        </div>
      )}

      {/* Pesan */}
      {wedding.message && (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="px-8 py-10 text-center border-t border-[#e8d9c0]"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm italic leading-relaxed text-[#6b5c45]"
          >
            "{wedding.message}"
          </motion.p>
        </motion.div>
      )}

      {/* Amplop Digital */}
      {(wedding.bankName && wedding.bankAccount) || (wedding.bankAccounts && wedding.bankAccounts.length > 0) || wedding.qrisImage ? (
        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="bg-[#f5ede0] px-8 py-10 text-center"
        >
          <motion.h3
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-xl font-bold text-[#5c4a32]"
          >
            Amplop Digital
          </motion.h3>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-2 text-sm text-[#8b7355]"
          >
            Doa restu Anda adalah hadiah terindah.
          </motion.p>
          <div className="mt-4 space-y-3">
            {/* Legacy single account */}
            {wedding.bankName && wedding.bankAccount && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05 }}
                className="inline-block rounded-lg bg-white p-4 shadow-sm border border-[#e8d9c0]"
              >
                <p className="text-sm font-semibold text-[#5c4a32]">{wedding.bankName} - {wedding.bankAccount}</p>
                {wedding.bankHolder && <p className="text-sm text-[#8b7355]">a.n. {wedding.bankHolder}</p>}
              </motion.div>
            )}
            {/* Multi rekening */}
            {bankAccounts.map((acc: { bank: string; account: string; holder: string }, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                whileHover={{ scale: 1.05 }}
                className="inline-block rounded-lg bg-white p-4 shadow-sm border border-[#e8d9c0]"
              >
                <p className="text-sm font-semibold text-[#5c4a32]">{acc.bank} - {acc.account}</p>
                {acc.holder && <p className="text-sm text-[#8b7355]">a.n. {acc.holder}</p>}
              </motion.div>
            ))}
            {/* QRIS */}
            {wedding.qrisImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                className="inline-block rounded-lg bg-white p-4 shadow-sm border border-[#e8d9c0]"
              >
                <p className="mb-2 text-sm font-semibold text-[#5c4a32]">QRIS</p>
                <div className="relative h-40 w-40 overflow-hidden rounded-lg">
                  <Image src={wedding.qrisImage} alt="QRIS" fill className="object-contain" />
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      ) : null}

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        className="bg-[#5c4a32] px-8 py-8 text-center text-[#fdf8f0]"
      >
        <motion.p
          initial={{ y: 20 }}
          whileInView={{ y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg font-bold"
        >
          {wedding.partner1} & {wedding.partner2}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-1 text-sm opacity-80"
        >
          Terima kasih atas doa dan kehadiran Anda.
        </motion.p>
      </motion.div>
    </div>
  );
}