import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { Plus, X, Radio, Check } from "lucide-react";
import { useI18n } from "@/lib/i18n";

export function NfcDemo() {
  const { t } = useI18n();
  const [phase, setPhase] = useState<"idle" | "scanning" | "open">("idle");

  const trigger = () => {
    setPhase("scanning");
    setTimeout(() => setPhase("open"), 1400);
  };

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Phone frame */}
      <div className="relative mx-auto aspect-[9/19] w-[280px] rounded-[42px] bg-surface-highest p-3 shadow-ambient">
        <div className="absolute left-1/2 top-2.5 h-5 w-24 -translate-x-1/2 rounded-b-2xl bg-background z-10" />
        <div className="relative h-full w-full overflow-hidden rounded-[32px] bg-gradient-to-b from-surface-low via-surface to-surface-low">
          {/* Default screen */}
          <div className="flex h-full flex-col items-center justify-center p-5 text-center">
            <AnimatePresence mode="wait">
              {phase === "idle" && (
                <motion.div
                  key="idle"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <Radio className="mx-auto h-10 w-10 text-primary" />
                  <p className="text-xs text-muted-foreground">{t("nfc.tap")}</p>
                </motion.div>
              )}
              {phase === "scanning" && (
                <motion.div
                  key="scan"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="space-y-3"
                >
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                  >
                    <Radio className="mx-auto h-10 w-10 text-primary" />
                  </motion.div>
                  <p className="text-xs text-muted-foreground">{t("nfc.scanning")}</p>
                </motion.div>
              )}
              {phase === "open" && (
                <motion.div
                  key="open"
                  initial={{ opacity: 0, y: 12, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className="w-full space-y-3"
                >
                  <div className="mx-auto h-16 w-16 rounded-full bg-gradient-primary p-0.5 shadow-glow-strong">
                    <div className="grid h-full w-full place-items-center rounded-full bg-surface-low text-2xl">
                      👩‍🎓
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-bold">Anna Kovaleva</div>
                    <div className="text-[10px] text-muted-foreground">
                      Creative Director · StartUpLab
                    </div>
                  </div>
                  <div className="space-y-1.5 text-left">
                    <div className="rounded-lg bg-surface-high px-2 py-1.5 text-[10px]">
                      🔗 portfolio.link
                    </div>
                    <div className="rounded-lg bg-surface-high px-2 py-1.5 text-[10px]">
                      📷 @kovaleva
                    </div>
                  </div>
                  <button className="w-full rounded-xl bg-gradient-primary py-2 text-xs font-bold text-primary-foreground shadow-glow">
                    <Plus className="mr-1 inline h-3 w-3" />
                    {t("land.add")}
                  </button>
                  <button
                    onClick={() => setPhase("idle")}
                    className="w-full rounded-xl bg-surface-high py-1.5 text-[10px] text-muted-foreground"
                  >
                    <X className="mr-1 inline h-3 w-3" />
                    {t("land.decline")}
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      {/* Brelok with ripple */}
      <button
        onClick={trigger}
        aria-label={t("nfc.tap")}
        className="group absolute -right-2 top-1/2 -translate-y-1/2 sm:right-2"
      >
        <span className="pointer-events-none absolute inset-0 rounded-full ripple-ring bg-primary/30" />
        <span className="pointer-events-none absolute inset-0 rounded-full ripple-ring-delay bg-primary/25" />
        <span className="pointer-events-none absolute inset-0 rounded-full ripple-ring-delay-2 bg-primary/20" />
        <span className="relative grid h-14 w-14 place-items-center rounded-full bg-gradient-primary shadow-glow-strong transition group-hover:scale-105">
          {phase === "open" ? (
            <Check className="h-6 w-6 text-primary-foreground" />
          ) : (
            <Radio className="h-6 w-6 text-primary-foreground" />
          )}
        </span>
      </button>
    </div>
  );
}
