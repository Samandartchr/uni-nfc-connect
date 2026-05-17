// src/components/TagSelectorI18n.tsx
import { useI18n } from "@/lib/i18n";
import { Check } from "lucide-react";

interface TagSelectorI18nProps {
  value: string[];           // array of selected keys (e.g. ["opt.int.dorama", "opt.int.anime"])
  onChange: (keys: string[]) => void;
  optionKeys: readonly string[];  // allowed keys to choose from
}

export function TagSelectorI18n({ value, onChange, optionKeys }: TagSelectorI18nProps) {
  const { t } = useI18n();

  const toggle = (key: string) => {
    if (value.includes(key)) {
      onChange(value.filter(k => k !== key));
    } else {
      onChange([...value, key]);
    }
  };

  return (
    <div className="rounded-2xl bg-surface-highest p-3 max-h-64 overflow-y-auto">
      <div className="flex flex-wrap gap-2">
        {optionKeys.map(key => {
          const isSelected = value.includes(key);
          return (
            <button
              key={key}
              type="button"
              onClick={() => toggle(key)}
              className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition-all
                ${isSelected 
                  ? "bg-gradient-primary text-primary-foreground shadow-glow-strong" 
                  : "bg-surface-low hover:bg-surface-high text-foreground"
                }`}
            >
              {isSelected && <Check className="h-3 w-3" />}
              {t(key)}   {/* translation happens here */}
            </button>
          );
        })}
      </div>
    </div>
  );
}