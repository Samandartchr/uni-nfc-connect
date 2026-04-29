import { Link, useLocation } from "react-router-dom";
import { useI18n } from "@/lib/i18n";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export function Header() {
  const { t, lang, setLang } = useI18n();
  const { user, signOut } = useAuth();
  const loc = useLocation();
  const onApp = loc.pathname !== "/" && !loc.pathname.startsWith("/auth");

  return (
    <header className="sticky top-0 z-40 glass-strong">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2 tap-highlight-none">
          <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-primary shadow-glow">
            <span className="text-base font-extrabold text-primary-foreground">U</span>
          </div>
          <div className="leading-tight">
            <div className="text-base font-bold tracking-tight">UniConnect</div>
            <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">The Future Hub</div>
          </div>
        </Link>

        <div className="flex items-center gap-1.5">
          <div className="hidden items-center gap-1 rounded-full bg-surface-low p-1 sm:flex">
            {(["ru", "kz", "en", "tr"] as const).map((l) => (
              <button key={l} onClick={() => setLang(l)}
                className={`rounded-full px-3 py-1 text-xs font-semibold transition ${lang === l ? "bg-gradient-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
                {l.toUpperCase()}
              </button>
            ))}
          </div>
          <button onClick={() => {
              const order = ["ru", "kz", "en", "tr"] as const;
              const next = order[(order.indexOf(lang as typeof order[number]) + 1) % order.length];
              setLang(next);
            }} className="rounded-full bg-surface-low px-3 py-1.5 text-xs font-bold sm:hidden">{lang.toUpperCase()}</button>

          {user ? (
            <>
              {!onApp && (<Button asChild variant="ghost" size="sm"><Link to="/feed">{t("nav.feed")}</Link></Button>)}
              <Button onClick={() => signOut()} variant="ghost" size="sm" className="hidden sm:inline-flex">{t("nav.signout")}</Button>
            </>
          ) : (
            <>
              <Button asChild variant="ghost" size="sm" className="hidden sm:inline-flex"><Link to="/auth">{t("nav.signin")}</Link></Button>
              <Button asChild size="sm" variant="hero"><Link to="/auth">{t("nav.signup")}</Link></Button>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
