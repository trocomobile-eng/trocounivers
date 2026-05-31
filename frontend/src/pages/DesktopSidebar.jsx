import { NavLink, useNavigate } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Heart,
  Home,
  MessageCircle,
  Plus,
  Repeat2,
  Settings,
  Sparkles,
  UserRound,
} from "lucide-react";

import { TrocoCard, TrocoButton } from "../components/ui";

const LINKS = [
  { to: "/feed", label: "Explorer", icon: Home },
  { to: "/library", label: "Ma bibliothèque", icon: BookOpen },
  { to: "/favorites", label: "Favoris", icon: Heart },
  { to: "/exchanges", label: "Trocs", icon: Repeat2 },
  { to: "/messages", label: "Messages", icon: MessageCircle, badge: 3 },
  { to: "/profile", label: "Profil", icon: UserRound },
  { to: "/settings", label: "Paramètres", icon: Settings },
];

export default function DesktopSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="sticky top-0 hidden h-screen w-[248px] shrink-0 flex-col border-r border-slate-200/70 bg-white/86 px-6 pb-6 pt-8 shadow-[18px_0_60px_rgba(15,23,42,0.035)] backdrop-blur-2xl lg:flex">
      <TrocoButton
        variant="plain"
        onClick={() => navigate("/feed")}
        className="mb-8 flex w-fit items-center p-0"
        aria-label="Accueil Troco"
      >
        <img src="/logo.png" alt="Troco" className="h-auto w-[118px] object-contain" />
      </TrocoButton>

      <button
        type="button"
        onClick={() => navigate("/add")}
        className="mb-7 flex h-[56px] w-full items-center justify-center gap-2 rounded-[20px] bg-[#0F7F45] text-[15px] font-black text-white shadow-[0_16px_30px_rgba(15,127,69,0.22)] transition hover:-translate-y-0.5 hover:bg-[#0b733d] active:scale-[0.98]"
      >
        <Plus size={17} strokeWidth={2.7} />
        Publier
      </button>

      <nav className="space-y-2">
        {LINKS.map(({ to, label, icon: Icon, badge }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex h-[52px] items-center gap-4 rounded-[18px] px-4 text-[14px] font-black transition",
                isActive
                  ? "bg-emerald-50/90 text-[#0B7145] shadow-[0_10px_28px_rgba(15,23,42,0.045)]"
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-950",
              ].join(" ")
            }
          >
            <Icon size={18} strokeWidth={2.25} />
            <span className="min-w-0 flex-1 truncate">{label}</span>
            {badge ? (
              <span className="flex h-6 min-w-6 items-center justify-center rounded-full bg-[#0F8B5A] px-1.5 text-[11px] font-black text-white">
                {badge}
              </span>
            ) : null}
          </NavLink>
        ))}
      </nav>

      <TrocoCard variant="ghost" className="mt-auto rounded-[24px] border border-slate-200/80 bg-white/82 p-5 shadow-[0_12px_32px_rgba(15,23,42,0.045)]">
        <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-50 text-[#0F8B5A]">
          <Sparkles size={17} strokeWidth={2.3} />
        </div>
        <p className="text-[13px] font-semibold leading-relaxed text-slate-500">
          Des objets qui circulent autrement.
        </p>

        <TrocoButton
          variant="plain"
          onClick={() => navigate("/contact")}
          className="mt-4 inline-flex items-center gap-2 p-0 text-[13px] font-black text-[#0B7145]"
        >
          Aide / Contact
          <ArrowRight size={14} strokeWidth={2.6} />
        </TrocoButton>
      </TrocoCard>
    </aside>
  );
}
