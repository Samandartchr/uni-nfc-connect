import { Link, useLocation } from "@tanstack/react-router";
import { Home, MessageSquare, User, Newspaper } from "lucide-react";
import { useI18n } from "@/lib/i18n";

const items = [
  { to: "/feed", icon: Newspaper, key: "nav.feed" },
  { to: "/messages", icon: MessageSquare, key: "nav.messages" },
  { to: "/profile", icon: User, key: "nav.profile" },
] as const;

export function BottomNav() {
  const loc = useLocation();
  const { t } = useI18n();
  return (
    <nav className="fixed bottom-3 left-1/2 z-40 w-[calc(100%-1.5rem)] max-w-md -translate-x-1/2 sm:bottom-5">
      <div className="glass-strong flex items-center justify-around rounded-3xl px-2 py-2 shadow-ambient">
        {items.map(({ to, icon: Icon, key }) => {
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
              <Icon className={`h-5 w-5 transition ${active ? "text-primary" : "text-muted-foreground"}`} />
              <span className={`text-[10px] font-semibold uppercase tracking-wider ${active ? "text-foreground" : "text-muted-foreground"}`}>
                {t(key)}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
