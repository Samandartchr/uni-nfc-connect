import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, Lock, Mail, User as UserIcon, Chrome } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";

export default function AuthPage() {
  const { t } = useI18n();
  const { user, signIn, signUp, signInWithGoogle, signInWithApple } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"in" | "up">("in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [providerLoading, setProviderLoading] = useState<null | "google" | "apple">(null);
  const [authActionInProgress, setAuthActionInProgress] = useState(false);

  useEffect(() => {
    if (user && !authActionInProgress) navigate("/feed");
  }, [user, authActionInProgress, navigate]);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthActionInProgress(true);
    setLoading(true);
    const { error, message } =
      mode === "in" ? await signIn(email, password) : await signUp(email, password, fullName);
    setLoading(false);
    setAuthActionInProgress(false);
    if (error) {
      toast.error(error);
    } else {
      toast.success(message ?? (mode === "in" ? "Welcome back!" : "Account created!"));
      if (mode === "in") {
        navigate("/feed");
      } else {
        setMode("in");
        setPassword("");
      }
    }
  };

  const onProviderSignIn = async (provider: "google" | "apple") => {
    setAuthActionInProgress(true);
    setProviderLoading(provider);
    const { error, message } =
      provider === "google" ? await signInWithGoogle() : await signInWithApple();
    setProviderLoading(null);
    setAuthActionInProgress(false);

    if (error) {
      toast.error(error);
      return;
    }

    toast.success(message ?? (provider === "google" ? "Signed in with Google." : "Signed in with Apple."));
    navigate("/feed");
  };

  return (
    <div className="relative grid min-h-screen place-items-center px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-gradient-glow" />
      <div className="relative w-full max-w-md">
        <Link
          to="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" /> UniConnect
        </Link>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl bg-surface-low p-7 shadow-ambient sm:p-10"
        >
          <h1 className="text-display text-3xl">
            {t(mode === "in" ? "auth.signin.title" : "auth.signup.title")}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(mode === "in" ? "auth.signin.sub" : "auth.signup.sub")}
          </p>

          <form onSubmit={onSubmit} className="mt-6 space-y-3">
            {mode === "up" && (
              <Field icon={UserIcon}>
                <Input
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder={t("auth.fullname")}
                  required
                  minLength={2}
                  className="border-0 bg-transparent pl-10"
                />
              </Field>
            )}
            <Field icon={Mail}>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.email")}
                required
                className="border-0 bg-transparent pl-10"
              />
            </Field>
            <Field icon={Lock}>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("auth.password")}
                required
                minLength={6}
                className="border-0 bg-transparent pl-10"
              />
            </Field>

            <Button
              type="submit"
              variant="hero"
              size="lg"
              disabled={loading}
              className="mt-2 w-full"
            >
              {loading ? "..." : t(mode === "in" ? "auth.submit.in" : "auth.submit.up")}
            </Button>
          </form>

          <div className="my-5 flex items-center gap-3 text-xs uppercase tracking-[0.24em] text-muted-foreground">
            <div className="h-px flex-1 bg-border/70" />
            <span>Or continue with</span>
            <div className="h-px flex-1 bg-border/70" />
          </div>

          <div className="grid gap-3 sm:grid-cols">
            <Button
              type="button"
              variant="glass"
              size="lg"
              disabled={providerLoading !== null}
              onClick={() => onProviderSignIn("google")}
              className="w-full"
            >
              <Chrome className="h-4 w-4" />
              {providerLoading === "google" ? "Connecting..." : "Google"}
            </Button>
          </div>

          <button
            type="button"
            onClick={() => setMode(mode === "in" ? "up" : "in")}
            className="mt-5 w-full text-center text-sm text-muted-foreground hover:text-foreground"
          >
            {t(mode === "in" ? "auth.toggle.up" : "auth.toggle.in")}
          </button>
        </motion.div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
}) {
  return (
    <div className="relative">
      <Icon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <div className="rounded-2xl bg-surface-highest">{children}</div>
    </div>
  );
}
