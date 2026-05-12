import { Link, useLocation } from "react-router-dom";
import { MessageSquare, User, Newspaper, Plus, Sparkles } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const items = [
  { to: "/feed", icon: Newspaper, key: "nav.feed" },
  { to: "/grow", icon: Sparkles, key: "nav.grow" },
  { to: "/messages", icon: MessageSquare, key: "nav.messages" },
  { to: "/profile", icon: User, key: "nav.profile" },
] as const;

export function BottomNav() {
  const loc = useLocation();
  const { t } = useI18n();
  return (
    <nav className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 sm:bottom-5">
      <div className="glass-strong flex items-center justify-around rounded-3xl px-2 py-2 shadow-ambient">
        {items.slice(0, 2).map(({ to, icon: Icon, key }) => {
          const active = loc.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-2 tap-highlight-none transition"
            >
              {active && (
                <span className="absolute inset-x-4 -top-0.5 h-0.5 rounded-full bg-gradient-primary shadow-glow" />
              )}
              <Icon
                className={`h-5 w-5 transition ${active ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${active ? "text-foreground" : "text-muted-foreground"}`}
              >
                {t(key)}
              </span>
            </Link>
          );
        })}
        <Link
          to="/post"
          title="Post"
          className="relative mx-1 grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-glow tap-highlight-none transition hover:-translate-y-0.5"
        >
          {loc.pathname.startsWith("/post") && (
            <span className="absolute inset-x-3 -top-1 h-0.5 rounded-full bg-primary-foreground/80" />
          )}
          <Plus className="h-6 w-6" />
        </Link>
        {items.slice(2).map(({ to, icon: Icon, key }) => {
          const active = loc.pathname.startsWith(to);
          return (
            <Link
              key={to}
              to={to}
              className="relative flex flex-1 flex-col items-center gap-0.5 rounded-2xl px-2 py-2 tap-highlight-none transition"
            >
              {active && (
                <span className="absolute inset-x-4 -top-0.5 h-0.5 rounded-full bg-gradient-primary shadow-glow" />
              )}
              <Icon
                className={`h-5 w-5 transition ${active ? "text-primary" : "text-muted-foreground"}`}
              />
              <span
                className={`text-[10px] font-semibold uppercase tracking-wider ${active ? "text-foreground" : "text-muted-foreground"}`}
              >
                {t(key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
