import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

interface MockUser {
  id: string;
  email: string;
  full_name: string;
}

interface AuthCtx {
  user: MockUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, fullName: string) => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);
const STORAGE_KEY = "uc.mock.user";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<MockUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window === "undefined") {
      setLoading(false);
      return;
    }
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setUser(JSON.parse(raw));
    } catch {}
    setLoading(false);
  }, []);

  const persist = (u: MockUser | null) => {
    setUser(u);
    if (typeof window === "undefined") return;
    if (u) localStorage.setItem(STORAGE_KEY, JSON.stringify(u));
    else localStorage.removeItem(STORAGE_KEY);
  };

  const signIn = async (email: string, _password: string) => {
    const name = email.split("@")[0] || "Demo User";
    persist({ id: "demo-user", email, full_name: name.charAt(0).toUpperCase() + name.slice(1) });
    return { error: null };
  };

  const signUp = async (email: string, _password: string, fullName: string) => {
    persist({ id: "demo-user", email, full_name: fullName || "Demo User" });
    return { error: null };
  };

  const signOut = async () => {
    persist(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
