import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Shield, MessageCircle } from "lucide-react";
import { AppLayout } from "@/components/uc/AppLayout";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { friends } from "@/lib/mockData";
import { toast } from "sonner";

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  if (authLoading || !user) return null;
  const filtered = friends.filter((f) => f.name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppLayout>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 rounded-3xl bg-surface-low p-6"
      >
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-secondary" />
          <span className="text-label text-secondary">{t("msg.mutuals")}</span>
        </div>
        <h2 className="text-display text-2xl">{t("msg.head")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("msg.body")}</p>
      </motion.div>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="h-12 rounded-2xl border-0 bg-surface-low pl-11"
        />
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-3xl bg-surface-low p-10 text-center">
          <MessageCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">{t("msg.empty")}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((f, i) => (
            <motion.button
              key={f.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.04 }}
              onClick={() => toast(t("msg.coming"))}
              className="flex w-full items-center gap-3 rounded-3xl bg-surface-low p-4 text-left transition hover:bg-surface-high"
            >
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-primary text-base font-bold text-primary-foreground">
                {f.name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{f.name}</div>
                <div className="truncate text-xs text-muted-foreground">{f.lastMessage}</div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
