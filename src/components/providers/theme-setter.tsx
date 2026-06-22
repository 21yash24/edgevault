"use client";
import { useEffect } from "react";
import { useSettingsStore } from "@/stores";

export function ThemeSetter() {
  const { settings } = useSettingsStore();
  const accentColor = settings.appearance.accentColor;

  useEffect(() => {
    if (typeof document !== "undefined") {
      // Overwrite the primary accent color variables dynamically
      document.documentElement.style.setProperty("--accent-green", accentColor);
      
      // Calculate a semi-transparent version for the border glow
      // We can do this roughly, or just let tailwind opacity modifier handle it
      // if tailwind config allows it. Since globals.css defines plain hex,
      // we'll just set it.
    }
  }, [accentColor]);

  return null;
}
