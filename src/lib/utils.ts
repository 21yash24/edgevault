import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let cachedCurrency: string | null = null;
let cachedCurrencySymbol: string | null = null;

export function formatCurrency(value: number, showSign = true): string {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("edgevault-settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        const c = parsed.state?.settings?.profile?.currency;
        if (c && c !== cachedCurrency) {
          cachedCurrency = c;
          cachedCurrencySymbol = c.match(/\((.*?)\)/)?.[1] || c || "$";
        }
      }
    } catch (e) {}
  }

  const symbol = cachedCurrencySymbol || "$";
  const val = value || 0;
  const prefix = showSign ? (val >= 0 ? "+" : "") : "";
  return `${prefix}${symbol}${Math.abs(val).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

export function formatPercent(value: number, showSign = true): string {
  const val = value || 0;
  const prefix = showSign ? (val >= 0 ? "+" : "") : "";
  return `${prefix}${val.toFixed(2)}%`;
}

export function formatR(value: number): string {
  const val = value || 0;
  const prefix = val >= 0 ? "+" : "";
  return `${prefix}${val.toFixed(2)}R`;
}

function getTimezone() {
  if (typeof window !== "undefined") {
    try {
      const stored = localStorage.getItem("edgevault-settings");
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed?.state?.settings?.preferences?.timezone) {
          return parsed.state.settings.preferences.timezone;
        }
      }
    } catch (e) {
      // fallback
    }
  }
  return Intl.DateTimeFormat().resolvedOptions().timeZone;
}

export function formatDate(date: Date | string): string {
  const tz = getTimezone();
  return formatInTimeZone(new Date(date), tz, "MMM dd, yyyy");
}

export function formatDateTime(date: Date | string): string {
  const tz = getTimezone();
  return formatInTimeZone(new Date(date), tz, "MMM dd, yyyy HH:mm");
}

export function formatTimeAgo(date: Date | string): string {
  // formatDistanceToNow evaluates relative time, timezone adjustment is not necessary as it compares to Date.now()
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes}m`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}

export function getPnlColor(value: number): string {
  if (value > 0) return "text-accent-green";
  if (value < 0) return "text-accent-coral";
  return "text-text-secondary";
}

export function getPnlBg(value: number): string {
  if (value > 0) return "bg-accent-green/10";
  if (value < 0) return "bg-accent-coral/10";
  return "bg-text-muted/10";
}

export function getHeatmapColor(value: number, max: number): string {
  if (value === 0) return "rgba(75, 80, 100, 0.3)";
  const intensity = Math.min(Math.abs(value) / max, 1);
  if (value > 0) {
    return `rgba(0, 255, 178, ${0.1 + intensity * 0.6})`;
  }
  return `rgba(255, 45, 85, ${0.1 + intensity * 0.6})`;
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}
