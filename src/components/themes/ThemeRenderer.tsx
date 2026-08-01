"use client";

import { getTheme } from "./registry";
import type { WeddingData } from "./types";

type Props = {
  themeKey: string;
  wedding: WeddingData;
};

export default function ThemeRenderer({ themeKey, wedding }: Props) {
  const { component: ThemeComponent } = getTheme(themeKey);
  return <ThemeComponent wedding={wedding} />;
}
