import { createFileRoute, Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Fingerprint, Network, Sparkles, Zap } from "lucide-react";
import { Header } from "@/components/uc/Header";
import { NfcDemo } from "@/components/uc/NfcDemo";
import { Button } from "@/components/ui/button";
import { useI18n } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UniConnect — Твой ключ к универу и новым знакомствам" },
      { name: "description", content: "NFC-сеть для студентов: знакомься за секунду, делись интересами, находи единомышленников." },
      { property: "og:title", content: "UniConnect — Твой ключ к универу" },
      { property: "og:description", content: "Прикоснись брелоком к телефону — открой профиль и знакомься." },
    ],
  }),
  component: Index,
});

function Index() {
  const { t } = useI18n();

  const features = [
    { icon: Fingerprint, k: "land.how.1" },
    { icon: Network, k: "land.how.2" },
    { icon: Sparkles, k: "land.how.3" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Glow backdrop */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[600px] bg-gradient-glow" />

      <Header />

      {/* HERO */}
      <section className="relative mx-auto max-w-6xl px-4 pb-16 pt-10 sm:px-6 sm:pt-16 lg:pb-28 lg:pt-24">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
          >
            <div className="text-label mb-5 text-primary/80">{t("land.welcome")}</div>
            <h1 className="text-display text-4xl sm:text-5xl lg:text-6xl">
              {t("land.title.l1")}
              <br />
              <span className="bg-gradient-to-r from-primary via-secondary to-primary bg-clip-text text-transparent">
                {t("land.title.l2")}
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("land.intro")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button asChild variant="hero" size="lg">
                <Link to="/auth">
                  {t("land.cta.start")} <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="glass" size="lg">
                <a href="#how">{t("land.cta.more")}</a>
              </Button>
            </div>
            <div className="text-label mt-10 text-muted-foreground/70">{t("brand.subline")}</div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.92 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.15 }}
          >
            <div className="relative">
              <div className="absolute -inset-10 -z-10 bg-gradient-glow blur-3xl" />
              <NfcDemo />
              <div className="mx-auto mt-6 max-w-xs text-center text-sm text-muted-foreground">
                {t("land.demo.sub")}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* HOW */}
      <section id="how" className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="mb-12 text-center">
          <div className="text-label mb-3">{t("land.welcome")}</div>
          <h2 className="text-display text-3xl sm:text-4xl lg:text-5xl">{t("land.how.title")}</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {features.map((f, i) => (
            <motion.div
              key={f.k}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="group relative overflow-hidden rounded-3xl bg-surface-low p-7 transition hover:bg-surface-high"
            >
              <div className="absolute -right-12 -top-12 h-40 w-40 rounded-full bg-gradient-glow opacity-0 transition group-hover:opacity-100" />
              <div className="relative">
                <div className="mb-5 inline-grid h-12 w-12 place-items-center rounded-2xl bg-surface-highest text-primary">
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mb-2 text-lg font-bold">{t(`${f.k}.t`)}</h3>
                <p className="text-sm leading-relaxed text-muted-foreground">{t(`${f.k}.d`)}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* LIVE FEED PREVIEW */}
      <section className="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:py-24">
        <div className="grid items-center gap-10 lg:grid-cols-2">
          <div>
            <div className="text-label mb-3 text-secondary">{t("land.feed.label")}</div>
            <h2 className="text-display text-3xl sm:text-4xl">{t("land.feed.title")}</h2>
            <p className="mt-5 text-base leading-relaxed text-muted-foreground">{t("land.feed.sub")}</p>
            <div className="mt-6 flex flex-wrap gap-2">
              {["#startup", "#ICPC", "#AI", "#networking", "#research"].map((tag) => (
                <span key={tag} className="rounded-full bg-surface-high px-4 py-1.5 text-xs font-semibold text-primary">{tag}</span>
              ))}
            </div>
          </div>
          <div className="space-y-3">
            <FeedCard name="Alexey Romanov" tag="2h ago" text="Запускаем закрытое бета-тестирование AI-планировщика для студентов. Кому интересно — пишите!" />
            <FeedCard name="Elena Volkova" tag="5h ago" text="Встреча киноклуба в этот четверг! Обсуждаем «Интерстеллар». Ждём всех в 18:00 в коворкинге." />
            <FeedCard name="UniLab Club" tag="вчера" verified text="Открытая лекция: «Этика в нейросетях». Регистрация по ссылке в профиле." />
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="relative mx-auto max-w-4xl px-4 py-20 sm:px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="relative overflow-hidden rounded-[2.5rem] bg-gradient-primary p-10 text-center sm:p-16"
        >
          <div className="absolute inset-0 opacity-30" style={{ background: "radial-gradient(circle at 30% 20%, white 0%, transparent 50%)" }} />
          <Zap className="relative mx-auto mb-4 h-10 w-10 text-primary-foreground" />
          <h2 className="text-display relative text-3xl text-primary-foreground sm:text-4xl">{t("land.cta.final.t")}</h2>
          <p className="relative mx-auto mt-3 max-w-md text-primary-foreground/80">{t("land.cta.final.s")}</p>
          <div className="relative mt-8 flex justify-center">
            <Button asChild variant="glass" size="xl">
              <Link to="/auth">
                {t("land.cta.start")} <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </section>

      {/* FOOTER */}
      <footer className="relative mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-lg bg-gradient-primary">
              <span className="text-xs font-extrabold text-primary-foreground">U</span>
            </div>
            <span className="text-sm font-bold">UniConnect</span>
          </div>
          <div className="text-xs text-muted-foreground">{t("foot.copy")}</div>
        </div>
      </footer>
    </div>
  );
}

function FeedCard({ name, tag, text, verified }: { name: string; tag: string; text: string; verified?: boolean }) {
  return (
    <div className="rounded-3xl bg-surface-low p-5">
      <div className="mb-3 flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-primary text-sm font-bold text-primary-foreground">
          {name[0]}
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            {name}
            {verified && <span className="grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">✓</span>}
          </div>
          <div className="text-xs text-muted-foreground">{tag}</div>
        </div>
      </div>
      <p className="text-sm leading-relaxed text-muted-foreground">{text}</p>
    </div>
  );
}
