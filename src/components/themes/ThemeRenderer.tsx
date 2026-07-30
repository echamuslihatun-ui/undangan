"use client";

import ClassicTheme from "./ClassicTheme";
import ModernTheme from "./ModernTheme";

type WeddingData = {
  partner1: string;
  partner2: string;
  parent1?: string | null;
  parent2?: string | null;
  fatherPria?: string | null;
  motherPria?: string | null;
  fatherWanita?: string | null;
  motherWanita?: string | null;
  akadDate?: string | null;
  resepsiDate?: string | null;
  location?: string | null;
  mapsUrl?: string | null;
  message?: string | null;
  photos?: string[] | null;
  musicUrl?: string | null;
  bankName?: string | null;
  bankAccount?: string | null;
  bankHolder?: string | null;
  bankAccounts?: Array<{ bank: string; account: string; holder: string }> | null;
  qrisImage?: string | null;
};

type Props = {
  themeKey: string;
  wedding: WeddingData;
};

export default function ThemeRenderer({ themeKey, wedding }: Props) {
  switch (themeKey) {
    case "modern":
      return <ModernTheme wedding={wedding} />;
    case "classic":
    default:
      return <ClassicTheme wedding={wedding} />;
  }
}
