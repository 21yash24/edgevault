"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import { cn } from "@/lib/utils";

// ─────────────────────────────────────────────
// Prop types
// ─────────────────────────────────────────────
export interface EmptyStateProps {
  type: "trades" | "analytics" | "playbook" | "notebook" | "alerts" | "general";
  title?: string;
  description?: string;
  action?: { label: string; onClick?: () => void; href?: string };
  className?: string;
}

// ─────────────────────────────────────────────
// Default copy per type
// ─────────────────────────────────────────────
const DEFAULTS: Record<
  EmptyStateProps["type"],
  { title: string; description: string }
> = {
  trades: {
    title: "No trades logged yet",
    description:
      "Log your first trade to start building your edge and unlock deep performance insights.",
  },
  analytics: {
    title: "Analytics await your data",
    description:
      "Complete trades to generate win-rate curves, equity charts, and AI-powered breakdowns.",
  },
  playbook: {
    title: "No playbooks defined",
    description:
      "Define your first trading strategy to track its edge, rules, and historical performance.",
  },
  notebook: {
    title: "Your trading notebook is empty",
    description:
      "Start journaling your sessions — track mindset, mistakes, and lessons learned.",
  },
  alerts: {
    title: "No alerts triggered",
    description: "You're trading clean. All price and risk alerts will surface here.",
  },
  general: {
    title: "Nothing here yet",
    description: "This section will populate as you use EdgeVault.",
  },
};

// ─────────────────────────────────────────────
// Per-type SVG illustrations
// ─────────────────────────────────────────────
function TradesSVG() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="es-trades-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <linearGradient id="es-trades-line" x1="0" y1="0" x2="120" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#00FFB2" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#00FFB2" />
        </linearGradient>
      </defs>

      {/* Background circle */}
      <circle cx="60" cy="60" r="52" fill="#00FFB2" fillOpacity="0.04" stroke="#00FFB2" strokeOpacity="0.12" strokeWidth="1" />

      {/* Chart grid lines */}
      {[72, 58, 44].map((y, i) => (
        <line key={i} x1="28" y1={y} x2="92" y2={y} stroke="white" strokeOpacity="0.04" strokeWidth="1" strokeDasharray="3 3" />
      ))}

      {/* Chart axis */}
      <line x1="28" y1="84" x2="92" y2="84" stroke="white" strokeOpacity="0.1" strokeWidth="1" />
      <line x1="28" y1="84" x2="28" y2="38" stroke="white" strokeOpacity="0.1" strokeWidth="1" />

      {/* Equity curve area fill */}
      <path
        d="M 28 78 L 42 68 L 52 72 L 62 56 L 74 48 L 86 38 L 86 84 L 28 84 Z"
        fill="url(#es-trades-line)"
        fillOpacity="0.08"
      />

      {/* Equity curve line */}
      <path
        d="M 28 78 L 42 68 L 52 72 L 62 56 L 74 48 L 86 38"
        stroke="#00FFB2"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        filter="url(#es-trades-glow)"
      />

      {/* Data points */}
      {[
        [28, 78], [42, 68], [52, 72], [62, 56], [74, 48], [86, 38],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="2.5" fill="#00FFB2" fillOpacity={i === 5 ? 1 : 0.5} />
      ))}

      {/* Plus button — add trade CTA hint */}
      <circle cx="86" cy="38" r="10" fill="#00FFB2" fillOpacity="0.15" stroke="#00FFB2" strokeOpacity="0.5" strokeWidth="1.5" filter="url(#es-trades-glow)" />
      <line x1="86" y1="33.5" x2="86" y2="42.5" stroke="#00FFB2" strokeWidth="2" strokeLinecap="round" />
      <line x1="81.5" y1="38" x2="90.5" y2="38" stroke="#00FFB2" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function AnalyticsSVG() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="es-analytics-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="60" cy="60" r="52" fill="#8F00FF" fillOpacity="0.05" stroke="#8F00FF" strokeOpacity="0.12" strokeWidth="1" />

      {/* Brain-ish radar hexagon */}
      <polygon
        points="60,30 82,43 82,70 60,83 38,70 38,43"
        stroke="#8F00FF"
        strokeOpacity="0.3"
        strokeWidth="1"
        fill="#8F00FF"
        fillOpacity="0.04"
      />
      <polygon
        points="60,40 74,48 74,65 60,73 46,65 46,48"
        stroke="#8F00FF"
        strokeOpacity="0.2"
        strokeWidth="1"
        fill="none"
      />

      {/* Radar fill */}
      <polygon
        points="60,36 78,50 72,68 60,70 45,62 46,47"
        fill="#8F00FF"
        fillOpacity="0.12"
        stroke="#8F00FF"
        strokeWidth="1.5"
        filter="url(#es-analytics-glow)"
      />

      {/* Spoke dots */}
      {[
        [60, 30], [82, 43], [82, 70], [60, 83], [38, 70], [38, 43],
      ].map(([cx, cy], i) => (
        <circle key={i} cx={cx} cy={cy} r="3" fill="#8F00FF" fillOpacity="0.6" />
      ))}

      {/* Center dot */}
      <circle cx="60" cy="60" r="4" fill="#00FFB2" filter="url(#es-analytics-glow)" />
    </svg>
  );
}

function PlaybookSVG() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="es-playbook-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="60" cy="60" r="52" fill="#8F00FF" fillOpacity="0.04" stroke="#8F00FF" strokeOpacity="0.1" strokeWidth="1" />

      {/* Book body */}
      <rect x="33" y="32" width="54" height="60" rx="5" fill="#8F00FF" fillOpacity="0.08" stroke="#8F00FF" strokeOpacity="0.3" strokeWidth="1.5" />

      {/* Book spine */}
      <rect x="33" y="32" width="8" height="60" rx="3" fill="#8F00FF" fillOpacity="0.2" />
      <line x1="41" y1="32" x2="41" y2="92" stroke="#8F00FF" strokeOpacity="0.4" strokeWidth="1" />

      {/* Page lines */}
      <line x1="50" y1="48" x2="78" y2="48" stroke="white" strokeOpacity="0.12" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="50" y1="56" x2="78" y2="56" stroke="white" strokeOpacity="0.12" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="50" y1="64" x2="70" y2="64" stroke="white" strokeOpacity="0.12" strokeWidth="1.5" strokeLinecap="round" />

      {/* Checkmark / strategy icon */}
      <circle cx="76" cy="76" r="13" fill="#8F00FF" fillOpacity="0.15" stroke="#8F00FF" strokeOpacity="0.5" strokeWidth="1.5" filter="url(#es-playbook-glow)" />
      <path d="M 70 76 L 74 80 L 83 70" stroke="#00FFB2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" filter="url(#es-playbook-glow)" />
    </svg>
  );
}

function NotebookSVG() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="es-notebook-glow">
          <feGaussianBlur stdDeviation="3" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="60" cy="60" r="52" fill="#00D4FF" fillOpacity="0.04" stroke="#00D4FF" strokeOpacity="0.1" strokeWidth="1" />

      {/* Notepad body */}
      <rect x="30" y="28" width="56" height="68" rx="6" fill="#00D4FF" fillOpacity="0.06" stroke="#00D4FF" strokeOpacity="0.25" strokeWidth="1.5" />

      {/* Top header */}
      <rect x="30" y="28" width="56" height="14" rx="5" fill="#00D4FF" fillOpacity="0.12" />
      <line x1="30" y1="42" x2="86" y2="42" stroke="#00D4FF" strokeOpacity="0.2" strokeWidth="1" />

      {/* Spiral holes */}
      {[35, 58, 81].map((y, i) => (
        <circle key={i} cx="60" cy={y} r="2.5" fill="none" stroke="#00D4FF" strokeOpacity="0.3" strokeWidth="1" />
      ))}

      {/* Text lines */}
      <line x1="38" y1="54" x2="78" y2="54" stroke="white" strokeOpacity="0.1" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="38" y1="62" x2="78" y2="62" stroke="white" strokeOpacity="0.1" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="38" y1="70" x2="66" y2="70" stroke="white" strokeOpacity="0.1" strokeWidth="1.5" strokeLinecap="round" />

      {/* Pen */}
      <g transform="translate(68, 72) rotate(-40)" filter="url(#es-notebook-glow)">
        <rect x="-3" y="-18" width="6" height="24" rx="2" fill="#00D4FF" fillOpacity="0.6" />
        <polygon points="-3,6 3,6 0,13" fill="#00D4FF" fillOpacity="0.9" />
        <rect x="-3" y="-22" width="6" height="5" rx="1" fill="#00D4FF" fillOpacity="0.35" />
      </g>
    </svg>
  );
}

function AlertsSVG() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="es-alerts-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="60" cy="60" r="52" fill="#00FFB2" fillOpacity="0.03" stroke="#00FFB2" strokeOpacity="0.08" strokeWidth="1" />

      {/* Bell shape */}
      <path
        d="M 60 26 C 47 26 37 36 37 50 L 37 68 L 30 76 L 90 76 L 83 68 L 83 50 C 83 36 73 26 60 26 Z"
        fill="#00FFB2"
        fillOpacity="0.08"
        stroke="#00FFB2"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        strokeLinejoin="round"
        filter="url(#es-alerts-glow)"
      />

      {/* Bell clapper */}
      <path
        d="M 52 76 Q 52 86 60 86 Q 68 86 68 76"
        fill="#00FFB2"
        fillOpacity="0.15"
        stroke="#00FFB2"
        strokeOpacity="0.4"
        strokeWidth="1.5"
      />

      {/* Zzz — sleeping / quiet */}
      <text x="68" y="48" fill="#00FFB2" fillOpacity="0.55" fontSize="9" fontWeight="bold" fontFamily="monospace">Z</text>
      <text x="75" y="40" fill="#00FFB2" fillOpacity="0.35" fontSize="7" fontWeight="bold" fontFamily="monospace">Z</text>
      <text x="80" y="34" fill="#00FFB2" fillOpacity="0.2" fontSize="5" fontWeight="bold" fontFamily="monospace">Z</text>
    </svg>
  );
}

function GeneralSVG() {
  return (
    <svg
      width="120"
      height="120"
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <defs>
        <filter id="es-general-glow">
          <feGaussianBlur stdDeviation="4" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <circle cx="60" cy="60" r="52" fill="#8F00FF" fillOpacity="0.04" stroke="#8F00FF" strokeOpacity="0.1" strokeWidth="1" />

      {/* Vault body */}
      <rect x="28" y="36" width="64" height="56" rx="8" fill="#8F00FF" fillOpacity="0.08" stroke="#8F00FF" strokeOpacity="0.3" strokeWidth="1.5" />

      {/* Vault door circle */}
      <circle cx="60" cy="64" r="18" fill="#8F00FF" fillOpacity="0.1" stroke="#8F00FF" strokeOpacity="0.4" strokeWidth="1.5" filter="url(#es-general-glow)" />

      {/* Inner circle */}
      <circle cx="60" cy="64" r="10" fill="#8F00FF" fillOpacity="0.08" stroke="#8F00FF" strokeOpacity="0.25" strokeWidth="1" />

      {/* Lock dial marks */}
      {[0, 60, 120, 180, 240, 300].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const x1 = 60 + 14 * Math.cos(rad);
        const y1 = 64 + 14 * Math.sin(rad);
        const x2 = 60 + 17 * Math.cos(rad);
        const y2 = 64 + 17 * Math.sin(rad);
        return (
          <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#8F00FF" strokeOpacity="0.4" strokeWidth="1.5" strokeLinecap="round" />
        );
      })}

      {/* Lock handle */}
      <path
        d="M 60 50 L 60 46 Q 60 40 54 40 Q 48 40 48 46 L 48 50"
        stroke="#00FFB2"
        strokeWidth="2"
        strokeLinecap="round"
        fill="none"
        filter="url(#es-general-glow)"
      />

      {/* Keyhole */}
      <circle cx="60" cy="64" r="3" fill="#8F00FF" fillOpacity="0.5" />
      <rect x="58.5" y="64" width="3" height="6" rx="1" fill="#8F00FF" fillOpacity="0.5" />
    </svg>
  );
}

const ILLUSTRATIONS: Record<EmptyStateProps["type"], React.FC> = {
  trades: TradesSVG,
  analytics: AnalyticsSVG,
  playbook: PlaybookSVG,
  notebook: NotebookSVG,
  alerts: AlertsSVG,
  general: GeneralSVG,
};

// ─────────────────────────────────────────────
// EmptyState — main export
// ─────────────────────────────────────────────
export function EmptyState({
  type,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  const defaults = DEFAULTS[type];
  const Illustration = ILLUSTRATIONS[type];

  const displayTitle = title ?? defaults.title;
  const displayDescription = description ?? defaults.description;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] }}
      className={cn(
        "flex flex-col items-center justify-center text-center py-16 px-6 gap-5",
        className
      )}
    >
      {/* Illustration with subtle ambient glow */}
      <motion.div
        initial={{ scale: 0.88, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.4, ease: "easeOut" }}
        className="relative"
      >
        {/* Glow behind illustration */}
        <div
          className="absolute inset-0 blur-3xl opacity-20 rounded-full scale-75"
          style={{
            background:
              type === "trades" || type === "alerts"
                ? "radial-gradient(circle, var(--accent-green), transparent)"
                : type === "analytics" || type === "playbook" || type === "general"
                ? "radial-gradient(circle, var(--accent-violet), transparent)"
                : "radial-gradient(circle, var(--accent-blue), transparent)",
          }}
        />
        <Illustration />
      </motion.div>

      {/* Copy */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2, duration: 0.35 }}
        className="space-y-2 max-w-sm"
      >
        <h3 className="text-base font-[family-name:var(--font-inter)] font-black text-text-primary tracking-tight">
          {displayTitle}
        </h3>
        <p className="text-sm text-text-muted leading-relaxed">
          {displayDescription}
        </p>
      </motion.div>

      {/* CTA action */}
      {action && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.32, duration: 0.3 }}
        >
          {action.href ? (
            <Link
              href={action.href}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                "bg-accent-green/10 text-accent-green border border-accent-green/20",
                "hover:bg-accent-green/20 hover:border-accent-green/40 hover:shadow-[0_0_20px_rgba(0,255,178,0.12)]",
                type === "playbook" || type === "analytics" || type === "general"
                  ? "bg-accent-violet/10 text-accent-violet border-accent-violet/20 hover:bg-accent-violet/20 hover:border-accent-violet/40 hover:shadow-[0_0_20px_rgba(143,0,255,0.12)]"
                  : ""
              )}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 1v10M1 6h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              {action.label}
            </Link>
          ) : (
            <button
              onClick={action.onClick}
              className={cn(
                "inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold transition-all duration-200",
                type === "playbook" || type === "analytics" || type === "general"
                  ? "bg-accent-violet/10 text-accent-violet border border-accent-violet/20 hover:bg-accent-violet/20 hover:border-accent-violet/40 hover:shadow-[0_0_20px_rgba(143,0,255,0.12)]"
                  : "bg-accent-green/10 text-accent-green border border-accent-green/20 hover:bg-accent-green/20 hover:border-accent-green/40 hover:shadow-[0_0_20px_rgba(0,255,178,0.12)]"
              )}
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 12 12"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M6 1v10M1 6h10"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              {action.label}
            </button>
          )}
        </motion.div>
      )}
    </motion.div>
  );
}
