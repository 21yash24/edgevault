"use client";
import React from "react";

export function LogoIcon({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="logo-grad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="var(--accent-green)" />
          <stop offset="100%" stopColor="var(--accent-violet)" />
        </linearGradient>
        <linearGradient id="shield-bg" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="rgba(0, 255, 178, 0.15)" />
          <stop offset="100%" stopColor="rgba(143, 0, 255, 0.03)" />
        </linearGradient>
      </defs>
      
      {/* Outer Hexagonal Shield */}
      <path
        d="M16 3 L27 7.5 V15 C27 21.5 22.3 27.2 16 29 C9.7 27.2 5 21.5 5 15 V7.5 L16 3 Z"
        fill="url(#shield-bg)"
        stroke="url(#logo-grad)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      
      {/* Ascending Bolt/Edge Trend */}
      <path
        d="M14.5 9 L22 14.5 L17 16.5 L20 23 L10 15 L15.5 14.5 L14.5 9 Z"
        fill="url(#logo-grad)"
      />
    </svg>
  );
}

export function Logo({ collapsed = false }: { collapsed?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <LogoIcon size={32} />
      {!collapsed && (
        <div className="flex flex-col">
          <span
            className="font-[family-name:var(--font-inter)] font-black text-[15px] tracking-widest leading-none"
            style={{
              background: "linear-gradient(90deg, var(--accent-green), var(--accent-violet))",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
            }}
          >
            EDGEVAULT
          </span>
          <span className="text-[8px] text-text-muted font-bold uppercase tracking-[0.2em] mt-1.5 leading-none">
            Pro Trading OS
          </span>
        </div>
      )}
    </div>
  );
}
