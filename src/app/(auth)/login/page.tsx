"use client";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { auth } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { ArrowRight, Mail, Lock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoIcon } from "@/components/ui/logo";
import { resetAllStores } from "@/stores";

export default function LoginPage() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      resetAllStores();
      if (isLogin) {
        await signInWithEmailAndPassword(auth!, email, password);
      } else {
        await createUserWithEmailAndPassword(auth!, email, password);
      }
      router.push("/dashboard");
    } catch (err: any) {
      // Clean up common firebase error messages
      let msg = err.message;
      if (msg.includes("auth/invalid-credential")) {
        msg = "Invalid email or password. Please try again.";
      } else if (msg.includes("auth/email-already-in-use")) {
        msg = "This email is already registered. Please sign in instead.";
      } else if (msg.includes("auth/weak-password")) {
        msg = "Password should be at least 6 characters.";
      } else if (msg.includes("auth/invalid-email")) {
        msg = "Please enter a valid email address.";
      }
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Premium Logo Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="flex flex-col items-center justify-center gap-3.5 mb-8 text-center"
      >
        <div className="relative group cursor-pointer select-none">
          {/* Pulsing Outer Neon Glows */}
          <div className="absolute -inset-1.5 rounded-2xl bg-gradient-to-r from-accent-green to-accent-violet opacity-25 blur-lg group-hover:opacity-50 transition duration-500" />
          <motion.div 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="relative w-16 h-16 bg-bg-card rounded-2xl flex items-center justify-center border border-border-subtle shadow-2xl"
          >
            <LogoIcon size={38} />
          </motion.div>
        </div>
        <div>
          <h1 
            className="font-[family-name:var(--font-inter)] font-black text-3xl tracking-widest leading-none"
            style={{
              background: "linear-gradient(90deg, var(--accent-green) 0%, var(--accent-violet) 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent"
            }}
          >
            EDGEVAULT
          </h1>
          <p className="text-[9px] text-text-muted font-bold uppercase tracking-[0.25em] mt-2 leading-none">
            Pro Trading OS
          </p>
        </div>
      </motion.div>

      {/* Main GlassCard Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.97 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
      >
        <GlassCard className="p-8 border border-border-subtle/40 relative overflow-hidden group/card shadow-[0_30px_100px_rgba(0,0,0,0.5)]">
          {/* Ambient Glowing Background Elements */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-accent-green/5 rounded-full blur-2xl pointer-events-none group-hover/card:bg-accent-green/10 transition-all duration-700" />
          <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-accent-violet/5 rounded-full blur-2xl pointer-events-none group-hover/card:bg-accent-violet/10 transition-all duration-700" />

          {/* Form Header */}
          <div className="text-center mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={isLogin ? "login-header" : "register-header"}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="font-[family-name:var(--font-inter)] font-black text-2xl text-text-primary tracking-tight mb-2">
                  {isLogin ? "Welcome Back" : "Create Vault"}
                </h2>
                <p className="text-xs text-text-secondary font-semibold">
                  {isLogin ? "Enter credentials to unlock your pro trading OS" : "Register below to secure your trading edge"}
                </p>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div 
                initial={{ opacity: 0, height: 0, y: -8 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -8 }}
                className="mb-6 p-3 rounded-xl bg-accent-coral/10 border border-accent-coral/20 text-xs font-bold text-accent-coral text-center flex items-center justify-center gap-2"
              >
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Authentication Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-[10px] text-text-muted font-bold uppercase tracking-wider mb-2 font-mono">Email Address</label>
              <div className="relative group/input">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within/input:text-accent-green transition-colors" size={14} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  placeholder="trader@edgevault.app"
                  className="w-full bg-bg-base/40 border border-border-subtle rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent-green/40 focus:ring-1 focus:ring-accent-green/20 transition-all duration-300 placeholder:text-text-muted/30 text-text-primary"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] text-text-muted font-bold uppercase tracking-wider mb-2 font-mono">Password</label>
              <div className="relative group/input">
                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-muted group-focus-within/input:text-accent-green transition-colors" size={14} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder="••••••••"
                  className="w-full bg-bg-base/40 border border-border-subtle rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-accent-green/40 focus:ring-1 focus:ring-accent-green/20 transition-all duration-300 placeholder:text-text-muted/30 text-text-primary"
                />
              </div>
            </div>

            {/* Submit Button */}
            <motion.button
              type="submit"
              disabled={loading}
              whileHover={{ scale: 1.01, boxShadow: "0 0 25px rgba(0,255,178,0.25)" }}
              whileTap={{ scale: 0.99 }}
              className="w-full flex items-center justify-center gap-2 text-bg-base font-black py-3.5 rounded-xl text-sm transition-all duration-300 disabled:opacity-50 select-none cursor-pointer"
              style={{
                background: "linear-gradient(135deg, var(--accent-green) 0%, var(--accent-blue) 100%)"
              }}
            >
              {loading ? "Authenticating..." : (isLogin ? "Sign In" : "Create Account")}
              {!loading && <ArrowRight size={15} className="stroke-[2.5]" />}
            </motion.button>
          </form>

          {/* Form Footer / Switch Toggle */}
          <div className="mt-6 text-center">
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="text-xs font-bold text-text-muted hover:text-accent-violet transition-colors duration-200"
            >
              {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
            </button>
          </div>
        </GlassCard>
      </motion.div>
    </div>
  );
}
