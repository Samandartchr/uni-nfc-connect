import { useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Sparkles, Target, Hash, UserPlus, Check, TrendingUp, Users } from "lucide-react";
import { AppLayout } from "@/components/uc/AppLayout";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { myProfile, peers, type MockProfile } from "@/lib/mockData";
import { toast } from "sonner";

type Tab = "goals" | "interests";

export default function GrowPage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();

  const [tab, setTab] = useState<Tab>("goals");
  const [q, setQ] = useState("");
  const [activeTag, setActiveTag] = useState<string | null>(null);
  const [smartOpen, setSmartOpen] = useState(false);
  const [sent, setSent] = useState<Set<string>>(new Set());

  useEffect(() => { if (!authLoading && !user) navigate("/auth"); }, [user, authLoading, navigate]);

  const me: MockProfile = myProfile;
  const myGoals = useMemo(() => new Set(me.goals.map(norm)), [me]);
  const myInterests = useMemo(() => new Set(me.interests.map(norm)), [me]);

  const scored = useMemo(() => peers.map((p) => {
    const gOverlap = p.goals.filter((g) => myGoals.has(norm(g))).length;
    const iOverlap = p.interests.filter((i) => myInterests.has(norm(i))).length;
    const gTotal = Math.max(myGoals.size + p.goals.length - gOverlap, 1);
    const iTotal = Math.max(myInterests.size + p.interests.length - iOverlap, 1);
    const score = Math.round(((gOverlap / gTotal) * 0.6 + (iOverlap / iTotal) * 0.4) * 100);
    return { p, gOverlap, iOverlap, score };
  }), [myGoals, myInterests]);

  const filteredGoals = useMemo(() => {
    const s = q.trim().toLowerCase();
    return scored
      .filter((x) => x.p.goals.length > 0)
      .filter((x) => !s || x.p.goals.some((g) => g.toLowerCase().includes(s)) || x.p.full_name.toLowerCase().includes(s))
      .sort((a, b) => b.score - a.score);
  }, [scored, q]);

  const tagBuckets = useMemo(() => {
    const map = new Map<string, MockProfile[]>();
    peers.forEach((p) => {
      p.interests.forEach((tag) => {
        const k = tag.replace(/^#/, "").toLowerCase();
        if (!k) return;
        const arr = map.get(k) ?? [];
        arr.push(p);
        map.set(k, arr);
      });
    });
    return [...map.entries()].map(([tag, list]) => ({ tag, list })).sort((a, b) => b.list.length - a.list.length);
  }, []);

  const filteredTags = useMemo(() => {
    const s = q.trim().toLowerCase().replace(/^#/, "");
    return s ? tagBuckets.filter((b) => b.tag.includes(s)) : tagBuckets;
  }, [tagBuckets, q]);

  const tagPeers = activeTag ? tagBuckets.find((b) => b.tag === activeTag)?.list ?? [] : [];
  const topMatches = useMemo(() => scored.filter((x) => x.score > 0).sort((a, b) => b.score - a.score).slice(0, 5), [scored]);

  const connect = (peerId: string) => { setSent((s) => new Set(s).add(peerId)); toast.success(t("grow.invited")); };

  if (authLoading || !user) return null;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative mb-6 overflow-hidden rounded-3xl p-6 grow-hero">
        <div className="relative">
          <div className="mb-2 flex items-center gap-2 text-label text-secondary">
            <Sparkles className="h-4 w-4" />
            <span>GROWTH NETWORK</span>
          </div>
          <h1 className="text-display text-3xl">{t("grow.title")}</h1>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">{t("grow.sub")}</p>
          <Button onClick={() => setSmartOpen((v) => !v)} variant="hero" size="sm" className="mt-4">
            <Sparkles className="h-3.5 w-3.5" />{t("grow.smart")}
          </Button>
        </div>
      </motion.div>

      <AnimatePresence>
        {smartOpen && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }}
            className="mb-6 overflow-hidden rounded-3xl bg-surface-low p-5">
            <div className="mb-3 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-secondary" />
              <h3 className="text-label">{t("grow.smart.title")}</h3>
            </div>
            {topMatches.length === 0 ? (<EmptyHint text={t("grow.empty")} />) : (
              <div className="space-y-2">
                {topMatches.map(({ p, score, gOverlap, iOverlap }) => (
                  <div key={p.id} className="flex items-center gap-3 rounded-2xl bg-surface-highest p-3">
                    <Avatar name={p.full_name} />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <div className="truncate font-semibold">{p.full_name}</div>
                        <MatchBadge score={score} />
                      </div>
                      <div className="truncate text-xs text-muted-foreground">{gOverlap} goals · {iOverlap} interests</div>
                    </div>
                    <ConnectButton sent={sent.has(p.id)} onClick={() => connect(p.id)} label={t("grow.invite")} sentLabel={t("grow.invited")} />
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mb-4 flex gap-2 rounded-2xl bg-surface-low p-1">
        <TabButton active={tab === "goals"} onClick={() => { setTab("goals"); setQ(""); setActiveTag(null); }} icon={Target}>{t("grow.tab.goals")}</TabButton>
        <TabButton active={tab === "interests"} onClick={() => { setTab("interests"); setQ(""); }} icon={Hash}>{t("grow.tab.interests")}</TabButton>
      </div>

      <div className="relative mb-4">
        <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder={tab === "goals" ? t("grow.search.goals") : t("grow.search.tags")}
          className="h-12 rounded-2xl border-0 bg-surface-low pl-11" />
      </div>

      {tab === "goals" ? (
        filteredGoals.length === 0 ? (<EmptyHint text={t("grow.empty")} />) : (
          <div className="space-y-3">
            {filteredGoals.map(({ p, score }, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }} className="rounded-3xl bg-surface-low p-4">
                <div className="flex items-start gap-3">
                  <Avatar name={p.full_name} />
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-semibold">{p.full_name}</div>
                      {score >= 20 && <MatchBadge score={score} />}
                    </div>
                    <div className="text-xs text-muted-foreground">{p.faculty || "—"}{p.course ? ` · ${t("grow.level")} ${p.course}` : ""}</div>
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {p.goals.slice(0, 4).map((g) => {
                        const matched = myGoals.has(norm(g));
                        return (
                          <span key={g} className={`rounded-2xl px-3 py-1 text-xs font-medium ${matched ? "bg-gradient-grow text-primary-foreground shadow-glow" : "bg-surface-highest text-foreground"}`}>
                            {matched && "✦ "}{g}
                          </span>
                        );
                      })}
                    </div>
                    {p.goals.some((g) => myGoals.has(norm(g))) && (<div className="mt-2 text-xs font-semibold text-secondary">{t("grow.similar")}</div>)}
                  </div>
                  <ConnectButton sent={sent.has(p.id)} onClick={() => connect(p.id)} label={t("grow.invite")} sentLabel={t("grow.invited")} />
                </div>
              </motion.div>
            ))}
          </div>
        )
      ) : activeTag ? (
        <div>
          <button onClick={() => setActiveTag(null)} className="mb-3 text-xs font-semibold text-primary">← #{activeTag}</button>
          {tagPeers.length === 0 ? (<EmptyHint text={t("grow.empty")} />) : (
            <div className="space-y-2">
              {tagPeers.map((p) => (
                <div key={p.id} className="flex items-center gap-3 rounded-3xl bg-surface-low p-4">
                  <Avatar name={p.full_name} />
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-semibold">{p.full_name}</div>
                    <div className="truncate text-xs text-muted-foreground">{p.faculty || "—"}</div>
                  </div>
                  <ConnectButton sent={sent.has(p.id)} onClick={() => connect(p.id)} label={t("grow.invite")} sentLabel={t("grow.invited")} />
                </div>
              ))}
            </div>
          )}
        </div>
      ) : filteredTags.length === 0 ? (<EmptyHint text={t("grow.empty")} />) : (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {filteredTags.slice(0, 30).map(({ tag, list }) => {
            const matched = myInterests.has(tag);
            return (
              <button key={tag} onClick={() => setActiveTag(tag)}
                className={`group rounded-3xl p-4 text-left transition hover:-translate-y-0.5 ${matched ? "bg-gradient-grow text-primary-foreground shadow-glow" : "bg-surface-low hover:bg-surface-high"}`}>
                <div className="flex items-center gap-1.5 text-base font-bold">
                  <Hash className="h-3.5 w-3.5 opacity-70" />
                  <span className="truncate">{tag}</span>
                </div>
                <div className={`mt-1 flex items-center gap-1 text-[11px] ${matched ? "text-primary-foreground/80" : "text-muted-foreground"}`}>
                  <Users className="h-3 w-3" />{list.length} {t("grow.tag.people")}
                </div>
              </button>
            );
          })}
        </div>
      )}
    </AppLayout>
  );
}

const norm = (s: string) => s.trim().toLowerCase().replace(/^#/, "");

function MatchBadge({ score }: { score: number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-gradient-grow px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-primary-foreground shadow-glow">
      <Sparkles className="h-3 w-3" />{score}%
    </span>
  );
}
function Avatar({ name }: { name: string }) {
  return (<div className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-gradient-grow text-base font-bold text-primary-foreground">{name[0]?.toUpperCase()}</div>);
}
function ConnectButton({ sent, onClick, label, sentLabel }: { sent: boolean; onClick: () => void; label: string; sentLabel: string }) {
  return (
    <button onClick={onClick} disabled={sent} title={sent ? sentLabel : label}
      className={`shrink-0 rounded-2xl px-3 py-2 text-[11px] font-bold uppercase tracking-wider transition ${sent ? "bg-surface-highest text-muted-foreground" : "bg-gradient-grow text-primary-foreground shadow-glow hover:-translate-y-0.5"}`}>
      {sent ? <Check className="inline h-3.5 w-3.5" /> : <UserPlus className="inline h-3.5 w-3.5" />}
    </button>
  );
}
function TabButton({ active, onClick, icon: Icon, children }: { active: boolean; onClick: () => void; icon: any; children: React.ReactNode }) {
  return (
    <button onClick={onClick}
      className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${active ? "bg-gradient-grow text-primary-foreground shadow-glow" : "text-muted-foreground hover:text-foreground"}`}>
      <Icon className="h-4 w-4" />{children}
    </button>
  );
}
function EmptyHint({ text }: { text: string }) {
  return (
    <div className="rounded-3xl bg-surface-low p-10 text-center">
      <Sparkles className="mx-auto mb-3 h-8 w-8 text-secondary" />
      <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
