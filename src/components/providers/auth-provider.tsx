"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { User, onAuthStateChanged, signOut } from "firebase/auth";
import { auth, isFirebaseConfigured } from "@/lib/firebase";
import { resetAllStores } from "@/stores";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  logout: () => Promise<void>;
  isDemoMode: boolean; // True if Firebase is not configured
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
  isDemoMode: true,
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const isDemoMode = !isFirebaseConfigured || !auth;

  useEffect(() => {
    if (isDemoMode) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth!, (u) => {
      // If switching accounts or logging out, wipe local store memory
      if (user && u?.uid !== user.uid) {
        resetAllStores();
      }
      setUser(u);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [isDemoMode, user]);

  const logout = async () => {
    if (!isDemoMode && auth) {
      await signOut(auth);
      resetAllStores();
      window.location.href = "/login";
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, logout, isDemoMode }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
