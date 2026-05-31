import { Link, NavLink, useNavigate } from "react-router-dom";
import {
  BookOpen,
  Heart,
  Home,
  MessageCircle,
  Plus,
  Repeat2,
  Settings,
  UserRound,
} from "lucide-react";

const LINKS = [
  { to: "/feed",      label: "Explorer",        icon: Home          },
  { to: "/library",   label: "Ma bibliothèque", icon: BookOpen      },
  { to: "/favorites", label: "Favoris",          icon: Heart         },
  { to: "/exchanges", label: "Trocs",            icon: Repeat2       },
  { to: "/messages",  label: "Messages",         icon: MessageCircle },
  { to: "/profile",   label: "Profil",           icon: UserRound     },
  { to: "/settings",  label: "Paramètres",       icon: Settings      },
];

export default function DesktopSidebar() {
  const navigate = useNavigate();

  return (
    <aside className="sticky top-0 hidden h-screen w-[240px] shrink-0 flex-col bg-white px-5 pb-6 pt-6 lg:flex">

      {/* Logo */}
      <Link to="/feed" className="mb-7 flex items-center pl-1" aria-label="Accueil Troco">
        <img src="/logo.png" alt="Troco" className="h-auto w-[110px] object-contain" />
      </Link>

      {/* Bouton Publier */}
      <button
        type="button"
        onClick={() => navigate("/add")}
        className="troco-primary-btn mb-6 flex h-[44px] w-full items-center justify-center gap-2 rounded-[16px] text-[14px]"
      >
        <Plus size={16} strokeWidth={2.5} />
        Publier
      </button>

      {/* Nav */}
      <nav className="flex-1 space-y-0.5">
        {LINKS.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            className={({ isActive }) =>
              [
                "flex h-[42px] items-center gap-3 rounded-[14px] px-3 text-[14px] font-semibold transition",
                isActive
                  ? "bg-[#F0FAF7] font-bold text-[#1ABEA3]"
                  : "text-[#64748b] hover:bg-[#F5F5F3] hover:text-[#0d1b2a]",
              ].join(" ")
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  size={17}
                  strokeWidth={isActive ? 2.4 : 2}
                  className={isActive ? "text-[#1ABEA3]" : ""}
                />
                <span>{label}</span>
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="mt-auto border-t border-[#F0F0EE] pt-4">
        <p className="px-3 text-[12px] font-medium leading-relaxed text-[#94a3b8]">
          Des objets qui circulent autrement.
        </p>
        <button
          type="button"
          onClick={() => navigate("/contact")}
          className="mt-2 px-3 text-[12px] font-bold text-[#0d1b2a] transition hover:text-[#1ABEA3]"
        >
          Aide / Contact
        </button>
      </div>
    </aside>
  );
}
