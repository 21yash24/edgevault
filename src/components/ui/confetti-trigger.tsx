"use client";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import confetti from "canvas-confetti";

export function ConfettiTrigger() {
  const searchParams = useSearchParams();

  useEffect(() => {
    if (searchParams?.get("celebrate") === "streak") {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ["#00FFB2", "#7B61FF", "#00D4FF", "#FF2D55"],
        disableForReducedMotion: true,
      });
      // Clean up URL without full reload
      if (typeof window !== "undefined") {
        const newUrl = window.location.pathname;
        window.history.replaceState({}, document.title, newUrl);
      }
    }
  }, [searchParams]);

  return null;
}
