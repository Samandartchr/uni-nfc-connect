import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Heart, MessageCircle, Sparkles, Send } from "lucide-react";
import { AppLayout } from "@/components/uc/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { initialPosts, type MockPost } from "@/lib/mockData";
import { toast } from "sonner";

export const Route = createFileRoute("/feed")({
  head: () => ({ meta: [{ title: "Лента — UniConnect" }] }),
  component: FeedPage,
});

function FeedPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [posts, setPosts] = useState<MockPost[]>(initialPosts);
  const [content, setContent] = useState("");
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (!authLoading && !user) navigate({ to: "/auth" });
  }, [user, authLoading, navigate]);

  const submit = () => {
    if (!content.trim() || !user) return;
    const post: MockPost = {
      id: `local-${Date.now()}`,
      author_id: user.id,
      author_name: user.full_name,
      faculty: "UniConnect",
      content: content.trim(),
      created_at: new Date().toISOString(),
      likes_count: 0,
      comments_count: 0,
    };
    setPosts((prev) => [post, ...prev]);
    setContent("");
    toast.success("Опубликовано!");
  };

  const toggleLike = (id: string) => {
    setLiked((prev) => {
      const next = new Set(prev);
      const isLiked = next.has(id);
      if (isLiked) next.delete(id);
      else next.add(id);
      setPosts((ps) => ps.map((p) => (p.id === id ? { ...p, likes_count: p.likes_count + (isLiked ? -1 : 1) } : p)));
      return next;
    });
  };

  if (authLoading || !user) return null;

  return (
    <AppLayout>
      <div className="mb-6 flex items-center gap-3">
        <Sparkles className="h-6 w-6 text-primary" />
        <h1 className="text-display text-3xl">{t("feed.title")}</h1>
      </div>

      <div className="mb-6 rounded-3xl bg-surface-low p-5">
        <Textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={t("feed.placeholder")}
          className="min-h-[80px] resize-none border-0 bg-transparent text-base focus-visible:ring-0"
          maxLength={500}
        />
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{content.length}/500</span>
          <Button onClick={submit} disabled={!content.trim()} variant="hero" size="sm">
            <Send className="h-3.5 w-3.5" />{t("feed.post")}
          </Button>
        </div>
      </div>

      {posts.length === 0 ? (
        <div className="rounded-3xl bg-surface-low p-10 text-center text-muted-foreground">{t("feed.empty")}</div>
      ) : (
        <div className="space-y-3">
          {posts.map((p, i) => (
            <motion.article
              key={p.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: Math.min(i * 0.04, 0.4) }}
              className="rounded-3xl bg-surface-low p-5 transition hover:bg-surface-high"
            >
              <header className="mb-3 flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary font-bold text-primary-foreground">
                  {p.author_name[0]?.toUpperCase()}
                </div>
                <div className="flex-1">
                  <div className="text-sm font-semibold">{p.author_name}</div>
                  <div className="text-xs text-muted-foreground">{p.faculty} · {timeAgo(p.created_at)}</div>
                </div>
              </header>
              <p className="whitespace-pre-wrap text-sm leading-relaxed">{p.content}</p>
              <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
                <button onClick={() => toggleLike(p.id)} className={`inline-flex items-center gap-1.5 transition ${liked.has(p.id) ? "text-secondary" : "hover:text-foreground"}`}>
                  <Heart className={`h-3.5 w-3.5 ${liked.has(p.id) ? "fill-current" : ""}`} />{p.likes_count}
                </button>
                <span className="inline-flex items-center gap-1.5"><MessageCircle className="h-3.5 w-3.5" />{p.comments_count}</span>
              </div>
            </motion.article>
          ))}
        </div>
      )}
    </AppLayout>
  );
}

function timeAgo(iso: string) {
  const d = (Date.now() - new Date(iso).getTime()) / 1000;
  if (d < 60) return `${Math.floor(d)}s`;
  if (d < 3600) return `${Math.floor(d / 60)}m`;
  if (d < 86400) return `${Math.floor(d / 3600)}h`;
  return `${Math.floor(d / 86400)}d`;
}
