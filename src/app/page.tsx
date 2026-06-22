"use client";
import { motion } from "framer-motion";
import Link from "next/link";
import {
  Zap, BookOpen, BarChart3, Copy, Shield, TrendingUp,
  Target, Bell, Users, Cpu, ArrowRight, Check, Star,
  ChevronRight,
} from "lucide-react";

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: "easeOut" as const },
};

const stagger = {
  animate: { transition: { staggerChildren: 0.08 } },
};

const features = [
  { icon: BookOpen, title: "Trading Journal", desc: "World-class trade logging with chart screenshots, emotion tracking, and AI-powered analysis." },
  { icon: BarChart3, title: "Analytics Suite", desc: "Bloomberg-level analytics. Equity curves, heatmaps, Sharpe ratio, and 20+ interactive charts." },
  { icon: Copy, title: "Copy Trading", desc: "Follow top-performing traders or publish your own signals. Built-in marketplace with verified P&L." },
  { icon: Shield, title: "Risk Manager", desc: "Daily kill switches, position sizing calculators, correlation detection, and cooldown timers." },
  { icon: TrendingUp, title: "Futures Module", desc: "Full futures support. Contract specs, tick calculators, DOM viewer, VWAP overlays, rollover alerts." },
  { icon: Target, title: "Playbook Builder", desc: "Document your strategies. Track win rates per setup. Share or sell in the marketplace." },
  { icon: Cpu, title: "MT5 Integration", desc: "Auto-sync trades from MetaTrader 5. Multi-broker, multi-account. Magic number filtering." },
  { icon: Bell, title: "Smart Alerts", desc: "Push, SMS, and email alerts. Economic calendar warnings. Drawdown breach notifications." },
  { icon: Users, title: "Community", desc: "Share trades, follow traders, join rooms. Discord webhooks. Weekly leaderboards." },
  { icon: Zap, title: "Prop Firm Tracker", desc: "Pre-loaded rules for FTMO, Apex, TopStep, and 10+ firms. Phase tracking, drawdown gauges." },
];

const plans = [
  {
    name: "Starter",
    price: "Free",
    period: "",
    desc: "Get started with the basics",
    features: ["50 trade entries/month", "Basic analytics", "1 account", "Community access"],
    cta: "Start Free",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$29",
    period: "/mo",
    desc: "For serious day traders",
    features: ["Unlimited trades", "Full analytics suite", "5 accounts", "Copy trading", "AI trade analysis", "Prop firm tracker", "Priority support"],
    cta: "Go Pro",
    highlight: true,
  },
  {
    name: "Team",
    price: "$79",
    period: "/mo",
    desc: "For trading teams & mentors",
    features: ["Everything in Pro", "Unlimited accounts", "Team dashboard", "Mentor tools", "API access", "Custom branding", "Dedicated support"],
    cta: "Start Team",
    highlight: false,
  },
];

const stats = [
  { value: "10,000+", label: "Active Traders" },
  { value: "500K+", label: "Trades Logged" },
  { value: "$2B+", label: "Volume Tracked" },
  { value: "98%", label: "Uptime" },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-bg-base overflow-hidden">
      {/* ===== NAV ===== */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-bg-base/70 backdrop-blur-xl border-b border-border-subtle">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-accent-green/20 flex items-center justify-center">
              <Zap size={18} className="text-accent-green" />
            </div>
            <span className="font-[family-name:var(--font-inter)] font-bold text-lg tracking-tight text-accent-green">
              EDGEVAULT
            </span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-text-secondary">
            <a href="#features" className="hover:text-text-primary transition-colors">Features</a>
            <a href="#pricing" className="hover:text-text-primary transition-colors">Pricing</a>
            <a href="#community" className="hover:text-text-primary transition-colors">Community</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-text-secondary hover:text-text-primary transition-colors">
              Log In
            </Link>
            <Link
              href="/login"
              className="bg-accent-green text-bg-base px-4 py-2 rounded-xl text-sm font-semibold hover:shadow-[0_0_30px_rgba(0,255,178,0.3)] transition-all duration-300"
            >
              Start Free
            </Link>
          </div>
        </div>
      </nav>

      {/* ===== HERO ===== */}
      <section className="relative pt-32 pb-20 px-6 gradient-hero overflow-hidden">
        {/* Background orbs */}
        <div className="absolute top-20 left-1/4 w-[500px] h-[500px] bg-accent-green/5 rounded-full blur-[120px] animate-float" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-accent-violet/5 rounded-full blur-[100px] animate-float" style={{ animationDelay: "2s" }} />

        <div className="max-w-5xl mx-auto text-center relative z-10">
          <motion.div {...fadeUp}>
            <div className="inline-flex items-center gap-2 bg-accent-green/10 border border-accent-green/20 rounded-full px-4 py-1.5 mb-8">
              <span className="w-2 h-2 rounded-full bg-accent-green animate-glow-pulse" />
              <span className="text-xs text-accent-green font-medium">Now in Public Beta</span>
            </div>
          </motion.div>

          <motion.h1
            className="font-[family-name:var(--font-inter)] font-extrabold text-5xl md:text-7xl lg:text-8xl leading-[0.95] mb-6 tracking-tight"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Your Edge.
            <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-green via-accent-green to-accent-violet">
              Your Vault.
            </span>
            <br />
            <span className="text-text-secondary text-4xl md:text-5xl lg:text-6xl">
              Your Trading OS.
            </span>
          </motion.h1>

          <motion.p
            className="text-text-secondary text-lg md:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            The all-in-one platform for serious traders. Journal, analyze, copy trade,
            manage risk, and track prop firm challenges — all with{" "}
            <span className="text-accent-green">military-grade precision</span>.
          </motion.p>

          <motion.div
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.45 }}
          >
            <Link
              href="/login"
              className="group flex items-center gap-2 bg-accent-green text-bg-base px-8 py-3.5 rounded-2xl font-semibold text-base hover:shadow-[0_0_40px_rgba(0,255,178,0.35)] transition-all duration-300 hover:scale-[1.02]"
            >
              Start Trading Free
              <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <a href="#features" className="flex items-center gap-2 glass px-8 py-3.5 rounded-2xl text-text-secondary hover:text-text-primary text-base transition-all">
              Watch Demo
              <ChevronRight size={18} />
            </a>
          </motion.div>

          {/* Hero Chart Mockup */}
          <motion.div
            className="mt-16 relative"
            initial={{ opacity: 0, y: 60 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.6 }}
          >
            <div className="glass-static p-1 rounded-2xl overflow-hidden max-w-4xl mx-auto">
              <div className="bg-bg-card rounded-xl p-6 relative overflow-hidden">
                {/* Mock Dashboard Preview */}
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-3 h-3 rounded-full bg-accent-coral/60" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
                  <div className="w-3 h-3 rounded-full bg-accent-green/60" />
                  <span className="text-xs text-text-muted ml-2 font-[family-name:var(--font-space-mono)]">edgevault.io/dashboard</span>
                </div>

                {/* Stat Cards Row */}
                <div className="grid grid-cols-4 gap-3 mb-4">
                  {[
                    { label: "Today's P&L", value: "+$1,247.50", color: "text-accent-green" },
                    { label: "Win Rate", value: "68.5%", color: "text-accent-violet" },
                    { label: "Total Trades", value: "142", color: "text-text-primary" },
                    { label: "Balance", value: "$54,832", color: "text-accent-green" },
                  ].map((s, i) => (
                    <div key={i} className="glass-static p-3 rounded-lg">
                      <div className="text-[10px] text-text-muted uppercase tracking-wider">{s.label}</div>
                      <div className={`font-[family-name:var(--font-space-mono)] font-bold text-sm mt-1 ${s.color}`}>{s.value}</div>
                    </div>
                  ))}
                </div>

                {/* Mock Equity Curve */}
                <div className="h-48 relative">
                  <svg viewBox="0 0 800 200" className="w-full h-full" preserveAspectRatio="none">
                    <defs>
                      <linearGradient id="heroGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#00FFB2" stopOpacity="0.3" />
                        <stop offset="100%" stopColor="#00FFB2" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    <path
                      d="M0,180 C50,175 80,160 120,155 C160,150 200,165 240,140 C280,115 320,130 360,100 C400,70 440,85 480,60 C520,35 560,50 600,30 C640,45 680,25 720,15 C760,20 800,10 800,10 L800,200 L0,200 Z"
                      fill="url(#heroGrad)"
                    />
                    <path
                      d="M0,180 C50,175 80,160 120,155 C160,150 200,165 240,140 C280,115 320,130 360,100 C400,70 440,85 480,60 C520,35 560,50 600,30 C640,45 680,25 720,15 C760,20 800,10 800,10"
                      fill="none"
                      stroke="#00FFB2"
                      strokeWidth="2.5"
                    />
                  </svg>
                </div>

                {/* Glow overlay */}
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-32 bg-accent-green/5 blur-[60px] rounded-full" />
              </div>
            </div>
            {/* Reflection glow */}
            <div className="absolute -bottom-20 left-1/2 -translate-x-1/2 w-3/4 h-40 bg-accent-green/8 blur-[80px] rounded-full" />
          </motion.div>
        </div>
      </section>

      {/* ===== STATS BAR ===== */}
      <section className="py-12 border-y border-border-subtle bg-bg-secondary/50">
        <div className="max-w-5xl mx-auto px-6">
          <motion.div
            className="grid grid-cols-2 md:grid-cols-4 gap-8"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {stats.map((s, i) => (
              <motion.div key={i} className="text-center" variants={fadeUp}>
                <div className="font-[family-name:var(--font-inter)] font-bold text-3xl md:text-4xl text-accent-green text-glow-green mb-1">{s.value}</div>
                <div className="text-sm text-text-secondary">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== FEATURES ===== */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeUp} viewport={{ once: true }} whileInView="animate" initial="initial">
            <h2 className="font-[family-name:var(--font-inter)] font-bold text-4xl md:text-5xl mb-4">
              Everything You Need.{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-green to-accent-violet">
                Nothing You Don&apos;t.
              </span>
            </h2>
            <p className="text-text-secondary text-lg max-w-xl mx-auto">
              10 integrated modules. One platform. Zero compromises.
            </p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
          >
            {features.map((f, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className="glass group cursor-pointer p-6"
              >
                <div className="w-10 h-10 rounded-xl bg-accent-violet/10 flex items-center justify-center mb-4 group-hover:bg-accent-green/10 transition-colors duration-300">
                  <f.icon size={20} className="text-accent-violet group-hover:text-accent-green transition-colors duration-300" />
                </div>
                <h3 className="font-[family-name:var(--font-inter)] font-bold text-lg mb-2">{f.title}</h3>
                <p className="text-sm text-text-secondary leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== PRICING ===== */}
      <section id="pricing" className="py-24 px-6 bg-bg-secondary/30">
        <div className="max-w-5xl mx-auto">
          <motion.div className="text-center mb-16" {...fadeUp} viewport={{ once: true }} whileInView="animate" initial="initial">
            <h2 className="font-[family-name:var(--font-inter)] font-bold text-4xl md:text-5xl mb-4">
              Simple, Transparent{" "}
              <span className="text-accent-green">Pricing</span>
            </h2>
            <p className="text-text-secondary text-lg">Start free. Upgrade when you&apos;re ready to go pro.</p>
          </motion.div>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            variants={stagger}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
          >
            {plans.map((plan, i) => (
              <motion.div
                key={i}
                variants={fadeUp}
                className={`rounded-2xl p-6 flex flex-col relative overflow-hidden ${
                  plan.highlight
                    ? "bg-gradient-to-b from-accent-green/10 to-bg-card border-2 border-accent-green/30"
                    : "glass"
                }`}
              >
                {plan.highlight && (
                  <div className="absolute top-0 right-0 bg-accent-green text-bg-base text-xs font-bold px-3 py-1 rounded-bl-lg">
                    MOST POPULAR
                  </div>
                )}

                <h3 className="font-[family-name:var(--font-inter)] font-bold text-xl mb-1">{plan.name}</h3>
                <p className="text-sm text-text-secondary mb-4">{plan.desc}</p>

                <div className="flex items-baseline gap-1 mb-6">
                  <span className="font-[family-name:var(--font-inter)] font-extrabold text-4xl">{plan.price}</span>
                  {plan.period && <span className="text-text-secondary text-sm">{plan.period}</span>}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((f, j) => (
                    <li key={j} className="flex items-center gap-2.5 text-sm text-text-secondary">
                      <Check size={14} className="text-accent-green flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/login"
                  className={`w-full py-3 rounded-xl text-sm font-semibold text-center transition-all duration-300 block ${
                    plan.highlight
                      ? "bg-accent-green text-bg-base hover:shadow-[0_0_30px_rgba(0,255,178,0.3)]"
                      : "bg-bg-card border border-border-subtle text-text-primary hover:border-accent-green/30 hover:bg-accent-green/5"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      <section className="py-24 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-accent-green/5 via-transparent to-accent-violet/5" />
        <motion.div
          className="max-w-3xl mx-auto text-center relative z-10"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="font-[family-name:var(--font-inter)] font-bold text-4xl md:text-5xl mb-4">
            Ready to Trade with an{" "}
            <span className="text-accent-green text-glow-green">Edge?</span>
          </h2>
          <p className="text-text-secondary text-lg mb-8">
            Join thousands of traders who&apos;ve already upgraded their trading OS.
          </p>
          <Link
            href="/login"
            className="inline-flex items-center gap-2 bg-accent-green text-bg-base px-10 py-4 rounded-2xl font-bold text-lg hover:shadow-[0_0_50px_rgba(0,255,178,0.35)] transition-all duration-300 hover:scale-[1.02]"
          >
            Get Started — It&apos;s Free
            <ArrowRight size={20} />
          </Link>
        </motion.div>
      </section>

      {/* ===== FOOTER ===== */}
      <footer className="border-t border-border-subtle py-12 px-6 bg-bg-secondary/30">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-lg bg-accent-green/20 flex items-center justify-center">
              <Zap size={14} className="text-accent-green" />
            </div>
            <span className="font-[family-name:var(--font-inter)] font-bold text-accent-green">EDGEVAULT</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-text-muted">
            <a href="#" className="hover:text-text-secondary transition-colors">Terms</a>
            <a href="#" className="hover:text-text-secondary transition-colors">Privacy</a>
            <a href="#" className="hover:text-text-secondary transition-colors">Discord</a>
            <a href="#" className="hover:text-text-secondary transition-colors">Twitter</a>
          </div>
          <div className="text-xs text-text-muted flex items-center gap-1">
            <Star size={12} className="text-accent-green" />
            Built for traders, by traders. © 2025
          </div>
        </div>
      </footer>
    </div>
  );
}
