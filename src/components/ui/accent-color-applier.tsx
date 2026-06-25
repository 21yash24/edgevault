"use client";
import { useEffect } from "react";
import { useSettingsStore } from "@/stores";

const ACCENT_COLORS: Record<string, string> = {
  violet: "#8F00FF",
  green: "#00FFB2",
  blue: "#00D4FF",
  coral: "#FF2D55",
  gold: "#FFD700",
};

export function AccentColorApplier() {
  const settings = useSettingsStore((s) => s.settings);
  const accentColor = settings?.appearance?.accentColor || "violet";
  const compactMode = settings?.appearance?.compactMode || false;

  useEffect(() => {
    const color = ACCENT_COLORS[accentColor] || ACCENT_COLORS.violet;
    document.documentElement.style.setProperty("--accent-primary", color);
    document.documentElement.style.setProperty("--accent-violet", color);
  }, [accentColor]);

  useEffect(() => {
    if (compactMode) {
      document.documentElement.classList.add("compact-mode");
    } else {
      document.documentElement.classList.remove("compact-mode");
    }
  }, [compactMode]);

  return null;
}
