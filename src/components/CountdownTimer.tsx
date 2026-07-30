"use client";

import { useState, useEffect } from "react";
import { Calendar } from "lucide-react";

type CountdownTimerProps = {
  targetDate: string | null;
};

export default function CountdownTimer({ targetDate }: CountdownTimerProps) {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  useEffect(() => {
    if (!targetDate) {
      setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      return;
    }

    const target = new Date(targetDate).getTime();

    const timer = setInterval(() => {
      const now = new Date().getTime();
      const difference = target - now;

      if (difference > 0) {
        const days = Math.floor(difference / (1000 * 60 * 60 * 24));
        const hours = Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const minutes = Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((difference % (1000 * 60)) / 1000);

        setTimeLeft({ days, hours, minutes, seconds });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [targetDate]);

  if (!targetDate) {
    return null;
  }

  const isEventPassed = timeLeft.days === 0 && timeLeft.hours === 0 && timeLeft.minutes === 0 && timeLeft.seconds === 0;

  return (
    <div className="w-full">
      <div className="flex items-center justify-center gap-2 mb-4">
        <Calendar className="h-5 w-5 text-primary" />
        <h3 className="font-serif text-xl font-bold">Countdown ke Acara</h3>
      </div>

      {isEventPassed ? (
        <div className="text-center py-8">
          <p className="text-2xl font-bold text-primary">Acara Telah Selesai</p>
          <p className="mt-2 text-muted-foreground">Terima kasih telah merayakan bersama kami</p>
        </div>
      ) : (
        <div className="grid grid-cols-4 gap-4">
          <div className="card-custom text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary">{timeLeft.days}</div>
            <div className="text-xs md:text-sm text-muted-foreground mt-1">Hari</div>
          </div>
          <div className="card-custom text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary">{timeLeft.hours}</div>
            <div className="text-xs md:text-sm text-muted-foreground mt-1">Jam</div>
          </div>
          <div className="card-custom text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary">{timeLeft.minutes}</div>
            <div className="text-xs md:text-sm text-muted-foreground mt-1">Menit</div>
          </div>
          <div className="card-custom text-center">
            <div className="text-3xl md:text-4xl font-bold text-primary">{timeLeft.seconds}</div>
            <div className="text-xs md:text-sm text-muted-foreground mt-1">Detik</div>
          </div>
        </div>
      )}
    </div>
  );
}