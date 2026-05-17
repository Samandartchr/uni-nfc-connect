import { useNavigate } from "react-router-dom";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  ChevronRight,
  Loader2,
  MessageCircle,
  RefreshCcw,
  Search,
  Send,
  Shield,
  Sparkles,
} from "lucide-react";
import { AppLayout } from "@/components/uc/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import {
  getChats,
  sendMessage as apiSendMessage,
  startChat,
  type ChatEntry,
  type Message,
} from "@/lib/api";
import { toast } from "sonner";

const POLL_INTERVAL = 5_000;

export default function MessagesPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [chats, setChats] = useState<ChatEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [q, setQ] = useState("");
  const [activeChat, setActiveChat] = useState<ChatEntry | null>(null);
  const [sending, setSending] = useState(false);
  const [starting, setStarting] = useState<string | null>(null);
  const [text, setText] = useState("");
  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  // ── fetch chats ────────────────────────────────────────────────────────────
  const fetchChats = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const data = await getChats();
      setChats(data);
      // Keep activeChat in sync
      setActiveChat((prev) => {
        if (!prev) return prev;
        const updated = data.find((c) => c.user.ID === prev.user.ID);
        return updated ?? prev;
      });
    } catch (err) {
      if (!silent) setError(err instanceof Error ? err.message : "Failed to load chats");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchChats();
  }, [user, fetchChats]);

  // ── polling ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user) return;
    pollRef.current = setInterval(() => fetchChats(true), POLL_INTERVAL);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [user, fetchChats]);

  // ── scroll to bottom on new messages ───────────────────────────────────────
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeChat?.messages.length]);

  // ── send ───────────────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!text.trim() || !activeChat || !user) return;
    const trimmed = text.trim();
    setText("");
    setSending(true);

    // Optimistic insert
    const optimistic: Message = {
      MessageID: `opt-${Date.now()}`,
      SenderID: user.id,
      Timestamp: new Date().toISOString(),
      Text: trimmed,
    };
    setActiveChat((prev) =>
      prev ? { ...prev, messages: [...prev.messages, optimistic] } : prev,
    );
    setChats((prev) =>
      prev.map((c) =>
        c.user.ID === activeChat.user.ID
          ? { ...c, messages: [...c.messages, optimistic] }
          : c,
      ),
    );

    try {
      const sent = await apiSendMessage({ RecipientID: activeChat.user.ID, Text: trimmed });
      if (sent) {
        // Replace optimistic with real message
        const replace = (msgs: Message[]) =>
          msgs.map((m) => (m.MessageID === optimistic.MessageID ? sent : m));
        setActiveChat((prev) => (prev ? { ...prev, messages: replace(prev.messages) } : prev));
        setChats((prev) =>
          prev.map((c) =>
            c.user.ID === activeChat.user.ID
              ? { ...c, messages: replace(c.messages) }
              : c,
          ),
        );
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not send message");
      // Rollback
      const remove = (msgs: Message[]) =>
        msgs.filter((m) => m.MessageID !== optimistic.MessageID);
      setActiveChat((prev) => (prev ? { ...prev, messages: remove(prev.messages) } : prev));
      setChats((prev) =>
        prev.map((c) =>
          c.user.ID === activeChat.user.ID ? { ...c, messages: remove(c.messages) } : c,
        ),
      );
      setText(trimmed);
    } finally {
      setSending(false);
    }
  };

  const handleStart = async (entry: ChatEntry) => {
    setStarting(entry.user.ID);
    try {
      await startChat(entry.user.ID);
      await fetchChats(false);
      setActiveChat((prev) =>
        prev?.user.ID === entry.user.ID
          ? { ...prev, messages: [] }
          : prev,
      );
      toast.success("Chat started!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start chat");
    } finally {
      setStarting(null);
    }
  };

  const filtered = chats.filter((c) =>
    c.user.Name.toLowerCase().includes(q.toLowerCase()),
  );

  if (authLoading || !user) return null;

  return (
    <AppLayout>
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <MessageCircle className="h-6 w-6 text-primary" />
        <h1 className="text-display text-3xl">{t("msg.title")}</h1>
      </div>

      {/* Two-panel layout */}
      <div className="grid gap-4 lg:grid-cols-[320px_1fr]">
        {/* ── Chat list ─────────────────────────────────────────────────────── */}
        <div className={`space-y-3 ${activeChat ? "hidden lg:block" : "block"}`}>
          {/* Privacy banner */}
          <div className="rounded-3xl bg-surface-low p-4">
            <div className="mb-1.5 flex items-center gap-2">
              <Shield className="h-3.5 w-3.5 text-secondary" />
              <span className="text-label text-secondary">{t("msg.mutuals")}</span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{t("msg.body")}</p>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Search…"
              className="h-12 rounded-2xl border-0 bg-surface-low pl-11"
            />
          </div>

          {/* List */}
          {loading ? (
            <div className="flex items-center justify-center gap-2 rounded-3xl bg-surface-low py-12 text-sm text-muted-foreground">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              Loading chats…
            </div>
          ) : error ? (
            <div className="rounded-3xl bg-surface-low p-6 text-center">
              <p className="mb-3 text-sm text-destructive">{error}</p>
              <Button onClick={() => fetchChats()} variant="hero" size="sm">
                <RefreshCcw className="h-3.5 w-3.5" />
                Retry
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl bg-surface-low p-10 text-center">
              <MessageCircle className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{t("msg.empty")}</p>
            </div>
          ) : (
            <div className="space-y-1.5">
              {filtered.map((entry, i) => {
                const last = entry.messages.at(-1);
                const isActive = activeChat?.user.ID === entry.user.ID;
                return (
                  <motion.button
                    key={entry.user.ID}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => setActiveChat(entry)}
                    className={`flex w-full items-center gap-3 rounded-3xl p-4 text-left transition ${
                      isActive
                        ? "bg-gradient-primary text-primary-foreground shadow-glow"
                        : "bg-surface-low hover:bg-surface-high"
                    }`}
                  >
                    <UserAvatar name={entry.user.Name} image={entry.user.ProfileImageLink} size="lg" />
                    <div className="min-w-0 flex-1">
                      <div className="truncate font-semibold">{entry.user.Name}</div>
                      <div
                        className={`truncate text-xs ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                      >
                        {last ? last.Text : "No messages yet"}
                      </div>
                    </div>
                    <ChevronRight
                      className={`h-4 w-4 shrink-0 ${isActive ? "text-primary-foreground/70" : "text-muted-foreground"}`}
                    />
                  </motion.button>
                );
              })}
            </div>
          )}
        </div>

        {/* ── Chat panel ────────────────────────────────────────────────────── */}
        <AnimatePresence mode="wait">
          {activeChat ? (
            <motion.div
              key={activeChat.user.ID}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="flex h-[calc(100vh-260px)] min-h-[480px] flex-col rounded-3xl bg-surface-low"
            >
              {/* Chat header */}
              <div className="flex items-center gap-3 rounded-t-3xl border-b border-white/5 px-4 py-3">
                <button
                  onClick={() => setActiveChat(null)}
                  className="grid h-8 w-8 shrink-0 place-items-center rounded-xl hover:bg-surface-highest lg:hidden"
                >
                  <ArrowLeft className="h-4 w-4" />
                </button>
                <UserAvatar
                  name={activeChat.user.Name}
                  image={activeChat.user.ProfileImageLink}
                  size="md"
                />
                <div className="min-w-0 flex-1">
                  <div className="truncate font-semibold">{activeChat.user.Name}</div>
                  <div className="truncate text-xs text-muted-foreground">
                    {[activeChat.user.Specialization, activeChat.user.Grade ? `Year ${activeChat.user.Grade}` : ""]
                      .filter(Boolean)
                      .join(" · ") || activeChat.user.Email || ""}
                  </div>
                </div>
                {/* Live indicator */}
                <div className="flex items-center gap-1.5 rounded-full bg-surface-highest px-3 py-1 text-[10px] font-semibold text-muted-foreground">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-green-400" />
                  LIVE
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto px-4 py-4">
                {activeChat.messages.length === 0 ? (
                  <EmptyChat
                    name={activeChat.user.Name}
                    loading={starting === activeChat.user.ID}
                    onStart={() => handleStart(activeChat)}
                  />
                ) : (
                  <div className="space-y-2">
                    {activeChat.messages.map((msg) => {
                      const isMine = msg.SenderID === user.id;
                      const isOptimistic = msg.MessageID.startsWith("opt-");
                      return (
                        <motion.div
                          key={msg.MessageID}
                          initial={{ opacity: 0, y: 6, scale: 0.97 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          className={`flex ${isMine ? "justify-end" : "justify-start"}`}
                        >
                          <div
                            className={`max-w-[72%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                              isMine
                                ? "bg-gradient-primary text-primary-foreground shadow-glow"
                                : "bg-surface-highest text-foreground"
                            } ${isOptimistic ? "opacity-70" : ""}`}
                          >
                            <p className="whitespace-pre-wrap break-words">{msg.Text}</p>
                            <p
                              className={`mt-0.5 text-[10px] ${isMine ? "text-primary-foreground/60" : "text-muted-foreground"} text-right`}
                            >
                              {formatTime(msg.Timestamp)}
                            </p>
                          </div>
                        </motion.div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                )}
              </div>

              {/* Input */}
              <div className="flex items-end gap-2 rounded-b-3xl border-t border-white/5 p-3">
                <Input
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  placeholder="Type a message…"
                  disabled={sending}
                  className="flex-1 rounded-2xl border-0 bg-surface-highest focus-visible:ring-1 focus-visible:ring-primary/40"
                />
                <Button
                  onClick={handleSend}
                  disabled={!text.trim() || sending}
                  variant="hero"
                  size="icon"
                  className="shrink-0"
                >
                  {sending ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Send className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="hidden place-items-center rounded-3xl bg-surface-low lg:grid"
            >
              <div className="text-center">
                <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-2xl bg-surface-highest text-primary">
                  <Sparkles className="h-8 w-8" />
                </div>
                <p className="text-sm font-semibold text-muted-foreground">
                  Select a conversation
                </p>
                <p className="mt-1 text-xs text-muted-foreground/60">
                  Choose a friend from the list to start chatting
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </AppLayout>
  );
}

// ── Sub-components ─────────────────────────────────────────────────────────

function UserAvatar({
  name,
  image,
  size,
}: {
  name: string;
  image?: string | null;
  size: "md" | "lg";
}) {
  const cls = size === "lg" ? "h-12 w-12 text-base" : "h-10 w-10 text-sm";
  return (
    <div
      className={`${cls} grid shrink-0 place-items-center overflow-hidden rounded-full bg-gradient-primary font-bold text-primary-foreground`}
    >
      {image ? (
        <img src={image} alt={name} className="h-full w-full object-cover" />
      ) : (
        name[0]?.toUpperCase()
      )}
    </div>
  );
}

function EmptyChat({
  name,
  loading,
  onStart,
}: {
  name: string;
  loading: boolean;
  onStart: () => void;
}) {
  return (
    <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-3xl bg-surface-highest text-3xl font-bold text-primary">
        {name[0]?.toUpperCase()}
      </div>
      <div>
        <p className="font-semibold">{name}</p>
        <p className="mt-1 text-sm text-muted-foreground">No messages yet. Say hello!</p>
      </div>
      <Button onClick={onStart} disabled={loading} variant="hero" size="sm">
        {loading ? (
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
        ) : (
          <MessageCircle className="h-3.5 w-3.5" />
        )}
        Start typing
      </Button>
    </div>
  );
}

// ── Helpers ────────────────────────────────────────────────────────────────

function formatTime(value: string) {
  const d = new Date(value);
  if (!isFinite(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();

  return sameDay
    ? d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : d.toLocaleDateString([], { month: "short", day: "numeric" });
}