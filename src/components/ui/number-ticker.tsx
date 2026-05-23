"use client";
import { useEffect, useState, useRef } from "react";
import { cn } from "@/lib/utils";

interface NumberTickerProps {
  value: number;
  format?: (value: number) => string;
  className?: string;
  duration?: number;
}

export function NumberTicker({ value, format, className, duration = 1000 }: NumberTickerProps) {
  const [display, setDisplay] = useState(value);
  const prevValue = useRef(value);
  const frameRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const start = prevValue.current;
    const end = value;
    const diff = end - start;
    if (Math.abs(diff) < 0.01) { setDisplay(end); return; }

    const startTime = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(start + diff * eased);
      if (progress < 1) frameRef.current = requestAnimationFrame(animate);
    };
    frameRef.current = requestAnimationFrame(animate);
    prevValue.current = value;
    return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current); };
  }, [value, duration]);

  const formatted = format ? format(display) : display.toFixed(2);
  return <span className={cn("font-[family-name:var(--font-space-mono)] tabular-nums", className)}>{formatted}</span>;
}
