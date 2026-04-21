import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Search, Shield, MessageCircle } from "lucide-react";
import { AppLayout } from "@/components/uc/AppLayout";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/messages")({
  head: () => ({ meta: [{ title: "Сообщения — UniConnect" }] }),
  component: MessagesPage,
});

interface Friend {
  id: string;
  friend_id: string;
  full_name: string;
  avatar_url: string;
  faculty: string;
}

function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [friends, setFriends] = useState<Friend[]>([]);
  const [q, setQ] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data, error } = await supabase
        .from("friendships")
        .select("id, requester_id, addressee_id, status")
        .or(`requester_id.eq.${user.id},addressee_id.eq.${user.id}`)
        .eq("status", "accepted");
      if (error) {
        toast.error(error.message);
        return;
      }
      const ids = (data ?? []).map((f) => (f.requester_id === user.id ? f.addressee_id : f.requester_id));
      if (ids.length === 0) {
        setFriends([]);
        return;
      }
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, faculty")
        .in("id", ids);
      setFriends(
        (profs ?? []).map((p) => ({ id: p.id, friend_id: p.id, full_name: p.full_name, avatar_url: p.avatar_url ?? "", faculty: p.faculty ?? "" }))
      );
    })();
  }, [user]);

  if (authLoading || !user) return null;
  const filtered = friends.filter((f) => f.full_name.toLowerCase().includes(q.toLowerCase()));

  return (
    <AppLayout>
      {/* Mutuals only banner */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-6 rounded-3xl bg-surface-low p-6">
        <div className="mb-3 flex items-center gap-2">
          <Shield className="h-4 w-4 text-secondary" />
          <span className="text-label text-secondary">{t("msg.mutuals")}</span>
        </div>
        <h2 className="text-display text-2xl">{t("msg.head")}</h2>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t("msg.body")}</p>
      </motion.div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search…"
          className="h-12 rounded-2xl border-0 bg-surface-low pl-11"
        />
      </div>

      {/* List */}
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
                {f.full_name[0]?.toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="truncate font-semibold">{f.full_name}</div>
                <div className="truncate text-xs text-muted-foreground">{f.faculty || t("msg.coming")}</div>
              </div>
            </motion.button>
          ))}
        </div>
      )}
    </AppLayout>
  );
}
