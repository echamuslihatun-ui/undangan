"use client";

import { useEffect, useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import type { Variants } from "framer-motion";
import { Calendar, MapPin, Clock } from "lucide-react";
import CountdownTimer from "@/components/CountdownTimer";
import { themeArray, type BankAccount, type WeddingData } from "./types";

const slideUp: Variants = {

  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const slideLeft: Variants = {
  hidden: { opacity: 0, x: -40 },
  visible: { opacity: 1, x: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

const COVER_FALLBACK =
  "https://images.unsplash.com/photo-1606216794074-735e91aa2c92?w=800";

/** Label jam acara dari jam mulai/selesai yang kini tersimpan terpisah. */
function eventTimeLabel(start?: string | null, end?: string | null) {
  if (start && end) return `${start} - ${end} WIB`;
  if (start) return `${start} WIB`;
  return null;
}

export default function ModernTheme({ wedding }: { wedding: WeddingData }) {
  const eventDate = wedding.resepsiDate || wedding.akadDate;
  const photos = themeArray<string>(wedding.photos);
  const bankAccounts = themeArray<BankAccount>(wedding.bankAccounts);
  // Cover mengikuti pengaturan dashboard; galeri lalu gambar contoh sebagai cadangan.
  const coverImage = wedding.heroImage || photos[0] || COVER_FALLBACK;
  const akadTime = eventTimeLabel(wedding.akadStart, wedding.akadEnd);
  const resepsiTime = eventTimeLabel(wedding.resepsiStart, wedding.resepsiEnd);
  const akadVenue = wedding.akadVenue || wedding.location;
  const resepsiVenue = wedding.resepsiVenue || wedding.location;
  // Lokasi umum hanya ditampilkan bila tiap acara belum punya tempat sendiri.
  const showGeneralLocation =
    !!wedding.location && !wedding.akadVenue && !wedding.resepsiVenue;
  const { scrollY } = useScroll();
  const yParallax = useTransform(scrollY, [0, 600], [0, -150]);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    if (wedding.musicUrl && audioRef.current) {
      audioRef.current.play().catch(() => {
        // Autoplay blocked, user needs to interact first
      });
    }
  }, [wedding.musicUrl]);

  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-xl" style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Cover dengan Parallax Effect */}
      <motion.div style={{ y: yParallax }} className="relative aspect-[3/4] overflow-hidden">
        <Image
          src={coverImage}
          alt="Cover"
          fill
          priority
          sizes="(max-width: 768px) 100vw, 50vw"
          className="object-cover scale-105"
        />
        <div className="absolute inset-0 bg-black/60" />
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="absolute inset-0 flex flex-col items-center justify-end p-10 text-white"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="text-xs tracking-[0.4em] uppercase text-white/60"
          >
            We Are Getting Married
          </motion.p>
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.8 }}
            className="mt-2 text-5xl font-black tracking-tight"
          >
            {wedding.partner1}
          </motion.h2>
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.7, duration: 0.5, type: "spring" }}
            className="my-2 h-px w-12 bg-white/40"
          />
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9, duration: 0.8 }}
            className="text-5xl font-black tracking-tight"
          >
            {wedding.partner2}
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.1, duration: 0.8 }}
            className="mt-4 text-sm text-white/70"
          >
            {eventDate
              ? new Date(eventDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })
              : "24 Agustus 2026"}
          </motion.p>
        </motion.div>
      </motion.div>

      {/* Pembuka */}
      <motion.div
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="px-8 py-12 text-center"
      >
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.2 }}
          className="mx-auto mb-6 h-px w-16 bg-black"
        />
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-xs tracking-[0.3em] uppercase text-gray-400"
        >
          Assalamualaikum Wr. Wb.
        </motion.p>
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-sm leading-relaxed text-gray-600"
        >
          Dengan penuh kebahagiaan, kami mengundang Bapak/Ibu/Saudara/i untuk hadir dalam acara pernikahan kami.
        </motion.p>
        <motion.div
          initial={{ opacity: 0, scaleX: 0 }}
          whileInView={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 0.7 }}
          className="mx-auto mt-6 h-px w-16 bg-black"
        />
      </motion.div>

      {/* Nama Mempelai */}
      <motion.div
        variants={slideLeft}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="bg-black px-8 py-12 text-white"
      >
        <div className="flex flex-col gap-8 sm:flex-row sm:items-center sm:justify-around">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center"
          >
            <h3 className="text-3xl font-black">{wedding.partner1}</h3>
            <p className="mt-2 text-xs text-white/50">
              {wedding.fatherPria || wedding.motherPria
                ? `Putra dari ${wedding.fatherPria || "Bapak"}${wedding.fatherPria && wedding.motherPria ? " & " : ""}${wedding.motherPria || "Ibu"}`
                : wedding.parent1 || "Putra dari Bapak & Ibu"}
            </p>
          </motion.div>
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            whileInView={{ scale: 1, rotate: 0 }}
            transition={{ delay: 0.4, duration: 0.6, type: "spring" }}
            className="text-center text-4xl font-thin text-white/30"
          >
            &
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
            className="text-center"
          >
            <h3 className="text-3xl font-black">{wedding.partner2}</h3>
            <p className="mt-2 text-xs text-white/50">
              {wedding.fatherWanita || wedding.motherWanita
                ? `Putri dari ${wedding.fatherWanita || "Bapak"}${wedding.fatherWanita && wedding.motherWanita ? " & " : ""}${wedding.motherWanita || "Ibu"}`
                : wedding.parent2 || "Putri dari Bapak & Ibu"}
            </p>
          </motion.div>
        </div>
      </motion.div>

      {/* Rangkaian Acara */}
      <motion.div
        variants={slideUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, margin: "-50px" }}
        className="px-8 py-12"
      >
        <motion.p
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          className="text-center text-xs tracking-[0.3em] uppercase text-gray-400"
        >
          Rangkaian Acara
        </motion.p>
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          {wedding.akadDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              className="border border-gray-100 p-6 cursor-pointer"
            >
              <h4 className="font-bold uppercase tracking-widest text-xs">Akad Nikah</h4>
              <div className="mt-3 space-y-1 text-sm text-gray-500">
                {akadTime && (
                  <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> {akadTime}</div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {new Date(wedding.akadDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </div>
                {akadVenue && (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {akadVenue}
                  </div>
                )}
              </div>
            </motion.div>
          )}
          {wedding.resepsiDate && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              whileHover={{ scale: 1.05, transition: { duration: 0.2 } }}
              className="border border-gray-100 p-6 cursor-pointer"
            >
              <h4 className="font-bold uppercase tracking-widest text-xs">Resepsi</h4>
              <div className="mt-3 space-y-1 text-sm text-gray-500">
                {resepsiTime && (
                  <div className="flex items-center gap-2"><Clock className="h-3 w-3" /> {resepsiTime}</div>
                )}
                <div className="flex items-center gap-2">
                  <Calendar className="h-3 w-3" />
                  {new Date(wedding.resepsiDate).toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}
                </div>
                {resepsiVenue && (
                  <div className="flex items-start gap-2">
                    <MapPin className="mt-0.5 h-3 w-3 shrink-0" /> {resepsiVenue}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </div>
        {showGeneralLocation && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
            className="mt-4 border border-gray-100 p-4 text-center cursor-pointer"
          >
            <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
              <MapPin className="h-4 w-4" /> {wedding.location}
            </div>
          </motion.div>
        )}
      </motion.div>

      {/* Countdown */}
      {eventDate && (
        <motion.div
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="bg-gray-50 px-8 py-12"
        >
          <CountdownTimer targetDate={eventDate} />
        </motion.div>
      )}

      {/* Galeri Foto */}
      {photos.length > 0 && (
        <motion.div
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="px-8 py-12"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-center text-xs tracking-[0.3em] uppercase text-gray-400"
          >
            Galeri Foto
          </motion.p>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
            {photos.map((photo: string, i: number) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, scale: 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                whileHover={{ scale: 1.1, transition: { duration: 0.2 } }}
                className="relative aspect-square overflow-hidden rounded-lg border border-gray-100 cursor-pointer"
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
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="px-8 py-12 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-sm leading-relaxed text-gray-500 italic"
          >
            "{wedding.message}"
          </motion.p>
        </motion.div>
      )}

      {/* Amplop Digital */}
      {(wedding.bankName && wedding.bankAccount) || (wedding.bankAccounts && wedding.bankAccounts.length > 0) || wedding.qrisImage ? (
        <motion.div
          variants={slideUp}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="px-8 py-12 text-center"
        >
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-xs tracking-[0.3em] uppercase text-gray-400"
          >
            Amplop Digital
          </motion.p>
          <div className="mt-6 space-y-3">
            {/* Legacy single account */}
            {wedding.bankName && wedding.bankAccount && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.3 }}
                whileHover={{ scale: 1.05 }}
                className="inline-block border border-gray-200 p-6"
              >
                <p className="font-bold">{wedding.bankName}</p>
                <p className="mt-1 text-sm text-gray-500">{wedding.bankAccount}</p>
                {wedding.bankHolder && <p className="mt-1 text-xs text-gray-400">a.n. {wedding.bankHolder}</p>}
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
                className="inline-block border border-gray-200 p-6"
              >
                <p className="font-bold">{acc.bank}</p>
                <p className="mt-1 text-sm text-gray-500">{acc.account}</p>
                {acc.holder && <p className="mt-1 text-xs text-gray-400">a.n. {acc.holder}</p>}
              </motion.div>
            ))}
            {/* QRIS */}
            {wedding.qrisImage && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                className="inline-block border border-gray-200 p-6"
              >
                <p className="mb-2 font-bold">QRIS</p>
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
        className="bg-black px-8 py-10 text-center text-white"
      >
        <motion.p
          initial={{ y: 20 }}
          whileInView={{ y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-lg font-black tracking-tight"
        >
          {wedding.partner1} & {wedding.partner2}
        </motion.p>
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-2 text-xs text-white/40 tracking-widest uppercase"
        >
          Thank You
        </motion.p>
      </motion.div>
    </div>
  );
}