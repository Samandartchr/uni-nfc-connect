import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Edit3, Radio, Save, X, KeyRound, Eye } from "lucide-react";
import { AppLayout } from "@/components/uc/AppLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/lib/auth";
import { useI18n } from "@/lib/i18n";
import { myProfile, type MockProfile } from "@/lib/mockData";
import { toast } from "sonner";

export default function ProfilePage() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { t } = useI18n();
  const [profile, setProfile] = useState<MockProfile>({ ...myProfile });
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<MockProfile>(profile);
  const [scanning, setScanning] = useState(false);
  const visitors = 12;

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      setProfile((p) => ({ ...p, full_name: user.full_name || p.full_name }));
      setDraft((p) => ({ ...p, full_name: user.full_name || p.full_name }));
    }
  }, [user]);

  const save = () => {
    setProfile(draft);
    setEditing(false);
    toast.success("Saved");
  };
  const fakeScan = () => {
    setScanning(true);
    setTimeout(() => {
      setScanning(false);
      toast.success(t("nfc.success"));
    }, 1600);
  };

  if (authLoading || !user) return null;
  const p = editing ? draft : profile;

  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col items-center pt-2 text-center">
          <div className="relative">
            <div className="h-28 w-28 rounded-full bg-gradient-primary p-1 shadow-glow-strong">
              <div className="grid h-full w-full place-items-center rounded-full bg-surface-low text-4xl">
                {p.full_name?.[0]?.toUpperCase() ?? "U"}
              </div>
            </div>
            {p.is_pro && (
              <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 rounded-full bg-gradient-primary px-3 py-0.5 text-[10px] font-bold tracking-wider text-primary-foreground shadow-glow">
                PRO
              </span>
            )}
          </div>
          {editing ? (
            <Input
              value={p.full_name}
              onChange={(e) => setDraft({ ...p, full_name: e.target.value })}
              className="mt-5 text-center text-2xl font-bold"
            />
          ) : (
            <h1 className="text-display mt-5 text-3xl">{p.full_name || "—"}</h1>
          )}
          {editing ? (
            <div className="mt-2 flex w-full max-w-xs gap-2">
              <Input
                value={p.faculty}
                placeholder={t("prof.faculty")}
                onChange={(e) => setDraft({ ...p, faculty: e.target.value })}
              />
              <Input
                value={p.course}
                placeholder={t("prof.course")}
                onChange={(e) => setDraft({ ...p, course: e.target.value })}
              />
            </div>
          ) : (
            <p className="mt-1 text-sm text-muted-foreground">
              {p.faculty || "—"}
              {p.course ? ` · ${p.course}` : ""}
            </p>
          )}
        </div>

        <div className="mt-5 flex justify-center gap-2">
          {editing ? (
            <>
              <Button onClick={save} variant="hero" size="sm">
                <Save className="h-3.5 w-3.5" />
                {t("prof.save")}
              </Button>
              <Button
                onClick={() => {
                  setDraft(profile);
                  setEditing(false);
                }}
                variant="ghost"
                size="sm"
              >
                <X className="h-3.5 w-3.5" />
                {t("prof.cancel")}
              </Button>
            </>
          ) : (
            <Button onClick={() => setEditing(true)} variant="glass" size="sm">
              <Edit3 className="h-3.5 w-3.5" />
              {t("prof.edit")}
            </Button>
          )}
        </div>

        <Section label={t("prof.about")}>
          {editing ? (
            <Textarea
              value={p.about}
              onChange={(e) => setDraft({ ...p, about: e.target.value })}
              className="border-0 bg-transparent"
              maxLength={300}
            />
          ) : (
            <p className="text-sm leading-relaxed text-muted-foreground">{p.about || "—"}</p>
          )}
        </Section>

        <Section label={t("prof.goals")}>
          {editing ? (
            <Input
              value={p.goals.join(", ")}
              onChange={(e) =>
                setDraft({
                  ...p,
                  goals: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="English B1→B2, Startup, ICPC"
              className="border-0 bg-transparent"
            />
          ) : p.goals.length ? (
            <div className="flex flex-wrap gap-2">
              {p.goals.map((g) => (
                <span
                  key={g}
                  className="rounded-2xl bg-surface-highest px-3.5 py-1.5 text-sm font-medium"
                >
                  {g}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </Section>

        <Section label={t("prof.interests")}>
          {editing ? (
            <Input
              value={p.interests.join(", ")}
              onChange={(e) =>
                setDraft({
                  ...p,
                  interests: e.target.value
                    .split(",")
                    .map((s) => s.trim())
                    .filter(Boolean),
                })
              }
              placeholder="finte, AI, chess"
              className="border-0 bg-transparent"
            />
          ) : p.interests.length ? (
            <div className="flex flex-wrap gap-2">
              {p.interests.map((i) => (
                <span
                  key={i}
                  className="rounded-full bg-surface-highest px-3 py-1 text-xs font-semibold text-primary"
                >
                  #{i.replace(/^#/, "")}
                </span>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">—</p>
          )}
        </Section>

        <Section
          label={t("prof.visitors")}
          extra={
            <span className="text-xs text-primary">
              {visitors} {t("prof.new")}
            </span>
          }
        >
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">{visitors} unique visits</span>
          </div>
        </Section>

        <div className="mt-6 rounded-3xl bg-surface-low p-5">
          <div className="flex items-start gap-3">
            <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-surface-highest text-primary">
              <KeyRound className="h-5 w-5" />
            </div>
            <p className="text-sm text-muted-foreground">{t("prof.found.key")}</p>
          </div>
        </div>

        <button
          onClick={fakeScan}
          disabled={scanning}
          className="relative mt-4 flex w-full items-center justify-center gap-3 overflow-hidden rounded-3xl bg-gradient-primary px-6 py-5 text-sm font-bold uppercase tracking-wider text-primary-foreground shadow-glow-strong transition hover:-translate-y-0.5"
        >
          {scanning && <span className="absolute inset-0 ripple-ring rounded-3xl bg-primary/40" />}
          <span className="relative grid h-9 w-9 place-items-center rounded-full bg-primary-foreground/20">
            <Radio className="h-4 w-4" />
          </span>
          <span className="relative">{scanning ? t("nfc.scanning") : t("prof.scan")}</span>
        </button>
      </motion.div>
    </AppLayout>
  );
}

function Section({
  label,
  children,
  extra,
}: {
  label: string;
  children: React.ReactNode;
  extra?: React.ReactNode;
}) {
  return (
    <section className="mt-4 rounded-3xl bg-surface-low p-5">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-label">{label}</h3>
        {extra}
      </div>
      {children}
    </section>
  );
}
