"use client";
import { useState } from "react";
import { useAuth } from "@/components/providers/auth-provider";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from "firebase/auth";
import { useRouter } from "next/navigation";
import { GlassCard } from "@/components/ui/glass-card";
import { Activity, AlertTriangle, ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

export default function LoginPage() {
  const { isDemoMode } = useAuth();
  const router = useRouter();
  
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    // Firebase Auth login/signup
    setLoading(true);
    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth!, email, password);
      } else {
        await createUserWithEmailAndPassword(auth!, email, password);
      }
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Logo */}
      <div className="flex items-center justify-center gap-3 mb-8">
        <div className="w-12 h-12 bg-accent-green/10 rounded-xl flex items-center justify-center border border-accent-green/20">
          <Activity className="text-accent-green" size={24} />
        </div>
        <span className="font-[family-name:var(--font-inter)] font-bold text-3xl tracking-tight">
          EDGEVAULT
        </span>
      </div>

      <GlassCard className="p-8">
        <div className="text-center mb-8">
          <h1 className="font-[family-name:var(--font-inter)] font-bold text-2xl mb-2">
            {isLogin ? "Welcome back" : "Create your vault"}
          </h1>
          <p className="text-sm text-text-secondary">
            {isLogin ? "Enter your credentials to access your trading OS" : "Sign up to start tracking your edge"}
          </p>
        </div>



        {error && (
          <div className="mb-6 p-3 rounded-xl bg-accent-coral/10 border border-accent-coral/20 text-sm text-accent-coral text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="trader@edgevault.app"
              className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-green/50 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-text-muted uppercase tracking-wider mb-2">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="••••••••"
              className="w-full bg-bg-base border border-border-subtle rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-accent-green/50 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full flex items-center justify-center gap-2 bg-accent-green text-bg-base font-bold py-3.5 rounded-xl text-sm hover:shadow-[0_0_30px_rgba(0,255,178,0.3)] transition-all disabled:opacity-50"
          >
            {loading ? "Authenticating..." : (isLogin ? "Sign In" : "Create Account")}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-text-muted hover:text-accent-violet transition-colors"
          >
            {isLogin ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
          </button>
        </div>
      </GlassCard>
    </div>
  );
}
