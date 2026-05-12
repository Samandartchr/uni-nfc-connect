import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  reload,
  sendEmailVerification,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { appleProvider, auth, googleProvider } from "@/lib/firebase";
import { callApiRequest } from "@/lib/api";

interface AuthUser {
  id: string;
  email: string;
  full_name: string;
  email_verified: boolean;
}

interface AuthResult {
  error: string | null;
  message?: string;
}

interface AuthCtx {
  user: AuthUser | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<AuthResult>;
  signUp: (email: string, password: string, fullName: string) => Promise<AuthResult>;
  signInWithGoogle: () => Promise<AuthResult>;
  signInWithApple: () => Promise<AuthResult>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthCtx | null>(null);

function toAuthUser(user: User): AuthUser {
  const fallbackName =
    user.displayName?.trim() || user.email?.split("@")[0]?.trim() || "UniConnect User";
  return {
    id: user.uid,
    email: user.email ?? "",
    full_name: fallbackName,
    email_verified: user.emailVerified,
  };
}

function getFullName(user: User) {
  return user.displayName?.trim() || user.email?.split("@")[0]?.trim() || "UniConnect User";
}

function isPasswordUser(user: User) {
  return user.providerData.some((provider) => provider.providerId === "password");
}

// Only called during registration (signUp + OAuth first time)
async function registerUser(user: User) {
  try {
    const response = await callApiRequest({
      Email: user.email ?? "",
      Name: getFullName(user),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Registration sync failed:", response.status, errorText);
      return {
        error:
          errorText || "Your account was authenticated, but the backend registration failed.",
      };
    }

    return { error: null };
  } catch (error) {
    console.error("Registration sync request failed:", error);
    return { error: "Could not reach the backend. Please try again." };
  }
}

function formatAuthError(error: unknown) {
  if (
    typeof error === "object" &&
    error !== null &&
    "code" in error &&
    typeof error.code === "string"
  ) {
    switch (error.code) {
      case "auth/email-already-in-use":
        return "This email is already in use.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "Invalid email or password.";
      case "auth/popup-closed-by-user":
        return "The sign-in popup was closed before completing authentication.";
      case "auth/cancelled-popup-request":
        return "Another sign-in popup is already open.";
      case "auth/account-exists-with-different-credential":
        return "An account already exists with a different sign-in method.";
      case "auth/weak-password":
        return "Password should be at least 6 characters.";
      case "auth/too-many-requests":
        return "Too many attempts. Please try again later.";
      case "auth/unauthorized-domain":
        return "This domain is not authorized in Firebase Authentication.";
      default:
        break;
    }
  }
  return "Authentication failed. Please try again.";
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Ref flag to prevent onAuthStateChanged from interfering during signUp flow
  const signingUp = useRef(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      if (!nextUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      await reload(nextUser);

      // Only block unverified password users — but never during active signUp
      if (isPasswordUser(nextUser) && !nextUser.emailVerified) {
        if (!signingUp.current) {
          await firebaseSignOut(auth);
          setUser(null);
        }
        setLoading(false);
        return;
      }

      setUser(toAuthUser(nextUser));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signIn = async (email: string, password: string): Promise<AuthResult> => {
    try {
      const credential = await signInWithEmailAndPassword(auth, email, password);
      await reload(credential.user);

      if (!credential.user.emailVerified) {
        await firebaseSignOut(auth);
        return { error: "Please verify your email before signing in." };
      }

      setUser(toAuthUser(credential.user));
      return { error: null, message: "Welcome back!" };
    } catch (error) {
      return { error: formatAuthError(error) };
    }
  };

  const signUp = async (
    email: string,
    password: string,
    fullName: string,
  ): Promise<AuthResult> => {
    signingUp.current = true;
    try {
      const credential = await createUserWithEmailAndPassword(auth, email, password);
      const trimmedName = fullName.trim();

      if (trimmedName) {
        await updateProfile(credential.user, { displayName: trimmedName });
      }

      await sendEmailVerification(credential.user);

      // Register with backend only on account creation
      const syncResult = await registerUser(credential.user);
      if (syncResult.error) {
        // Clean up: delete the firebase account so the user can retry cleanly
        await credential.user.delete().catch(() => null);
        return syncResult;
      }

      await firebaseSignOut(auth);
      setUser(null);

      return {
        error: null,
        message: "Account created! Check your email to verify your account.",
      };
    } catch (error) {
      return { error: formatAuthError(error) };
    } finally {
      signingUp.current = false;
    }
  };

  const signInWithGoogle = async (): Promise<AuthResult> => {
    try {
      const credential = await signInWithPopup(auth, googleProvider);
      const normalizedName = getFullName(credential.user);

      if (credential.user.displayName !== normalizedName) {
        await updateProfile(credential.user, { displayName: normalizedName });
      }

      // For OAuth, upsert the user on the backend (handles both new and returning users)
      const syncResult = await registerUser(credential.user);
      if (syncResult.error) {
        await firebaseSignOut(auth);
        return syncResult;
      }

      setUser(toAuthUser(credential.user));
      return { error: null, message: "Signed in with Google." };
    } catch (error) {
      return { error: formatAuthError(error) };
    }
  };

  const signInWithApple = async (): Promise<AuthResult> => {
    try {
      const credential = await signInWithPopup(auth, appleProvider);

      const syncResult = await registerUser(credential.user);
      if (syncResult.error) {
        await firebaseSignOut(auth);
        return syncResult;
      }

      setUser(toAuthUser(credential.user));
      return { error: null, message: "Signed in with Apple." };
    } catch (error) {
      return { error: formatAuthError(error) };
    }
  };

  const signOut = async () => {
    await firebaseSignOut(auth);
  };

  return (
    <AuthContext.Provider
      value={{ user, loading, signIn, signUp, signInWithGoogle, signInWithApple, signOut }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be inside AuthProvider");
  return ctx;
}
