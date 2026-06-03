import { useEffect, useRef } from "react";
import {
  BookOpen,
  Grid2X2,
  Home,
  Music2,
  Shirt,
  Smartphone,
  Trophy,
  Sparkles,
} from "lucide-react";

const CATEGORIES = [
  { label: "Tout", icon: Grid2X2 },
  { label: "Maison", icon: Home },
  { label: "Mode", icon: Shirt },
  { label: "Loisirs", icon: Trophy },
  { label: "Tech", icon: Smartphone },
  { label: "Livres", icon: BookOpen },
  { label: "Musique", icon: Music2 },
  { label: "Autres", icon: Sparkles },
];

export default function CategoryPills({ activeCategory = "Tout", onChange }) {
  const activeRef = useRef(null);

  useEffect(() => {
    activeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [activeCategory]);

  return (
    <div className="flex items-center gap-2">
      {CATEGORIES.map(({ label, icon: Icon }) => {
        const active = activeCategory === label;

        return (
          <button
            key={label}
            ref={active ? activeRef : null}
            type="button"
            onClick={() => onChange?.(label)}
            className={[
              "inline-flex h-[38px] shrink-0 items-center gap-2 rounded-[16px] border px-3.5 text-[13px] font-extrabold tracking-[-0.015em] transition active:scale-[0.98]",
              active
                ? "border-transparent bg-gradient-to-br from-[#1ABEA3] to-[#36C982] text-white shadow-[0_12px_26px_rgba(26,190,163,0.14)]"
                : "border-[#E6EFEB] bg-white/96 text-[#233241] shadow-[0_8px_22px_rgba(15,23,42,0.045)]",
            ].join(" ")}
          >
            <Icon size={17} strokeWidth={2.25} />
            {label}
          </button>
        );
      })}
    </div>
  );
}
