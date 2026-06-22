import type { Metadata } from "next";
import { Syne, Space_Mono, Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/components/providers/auth-provider";
import { ThemeProvider } from "next-themes";
import { ThemeSetter } from "@/components/providers/theme-setter";

const syne = Syne({
  variable: "--font-syne",
  subsets: ["latin"],
  weight: ["700", "800"],
  display: "swap",
});

const spaceMono = Space_Mono({
  variable: "--font-space-mono",
  subsets: ["latin"],
  weight: ["400", "700"],
  display: "swap",
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "EDGEVAULT — Your Trading OS",
  description:
    "The ultimate day trading platform. Journal, analyze, copy trade, and manage risk — all in one premium trading OS built for serious traders.",
  keywords: [
    "trading journal", "day trading", "trading analytics", "copy trading",
    "prop firm tracker", "trading platform", "risk management",
  ],
  openGraph: {
    title: "EDGEVAULT — Your Trading OS",
    description: "Journal. Analyze. Execute. The trading platform built for edge.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${syne.variable} ${spaceMono.variable} ${inter.variable}`}
      suppressHydrationWarning
    >
      <body className="min-h-screen bg-bg-base text-text-primary font-[family-name:var(--font-inter)] antialiased relative overflow-x-hidden">
        {/* Animated Background Blobs */}
        <div className="fixed -top-20 -left-20 w-[500px] h-[500px] bg-accent-violet/10 rounded-full blur-[120px] animate-pulse -z-10" />
        <div className="fixed top-1/2 -right-20 w-[600px] h-[600px] bg-accent-green/5 rounded-full blur-[120px] animate-pulse -z-10" style={{ animationDelay: "2s" }} />
        
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <ThemeSetter />
          <AuthProvider>
            {children}
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
