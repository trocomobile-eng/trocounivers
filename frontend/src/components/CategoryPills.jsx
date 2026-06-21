import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
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
          <motion.button
            key={label}
            ref={active ? activeRef : null}
            type="button"
            onClick={() => onChange?.(label)}
            whileTap={{ scale: 0.91 }}
            className={[
              "relative inline-flex h-[34px] shrink-0 items-center gap-1.5 rounded-[14px] border px-3 text-[12px] font-extrabold tracking-[-0.01em] overflow-hidden",
              active
                ? "border-transparent text-white shadow-[0_12px_26px_rgba(26,190,163,0.22)]"
                : "border-[#E6EFEB] bg-white/96 text-[#233241] shadow-[0_8px_22px_rgba(15,23,42,0.045)]",
            ].join(" ")}
          >
            {active && (
              <motion.span
                layoutId="category-pill-bg"
                className="absolute inset-0 bg-gradient-to-br from-[#1ABEA3] to-[#36C982]"
                style={{ borderRadius: 16 }}
                transition={{ type: "spring", stiffness: 400, damping: 32 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              <Icon size={14} strokeWidth={2.25} />
              {label}
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
