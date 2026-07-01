import { Link } from "react-router-dom";

const LEGAL_LINKS = [
  { to: "/terms", label: "Conditions d'utilisation" },
  { to: "/privacy", label: "Confidentialité" },
  { to: "/mentions", label: "Mentions légales" },
];

const DISCOVER_LINKS = [
  { to: "/quest-ce-que-troco", label: "Qu'est-ce que Troco ?" },
  { to: "/comment-ca-marche", label: "Comment ça marche ?" },
  { to: "/troc-local-paris", label: "Troc local à Paris" },
  { to: "/application-troc-objets", label: "Application de troc d'objets" },
  { to: "/echanger-sans-argent", label: "Échanger sans argent" },
  { to: "/troco-vs-vinted-leboncoin-geev", label: "Troco vs Vinted, Leboncoin, Geev" },
];

export default function TrocoFooter({ compact = false, className = "" }) {
  if (compact) {
    return (
      <footer className={["border-t border-[#E4ECE8] bg-white/60 px-5 py-4 backdrop-blur-xl", className].join(" ")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-[11px] font-semibold text-slate-400">© 2025 Troco</p>
          <div className="flex flex-wrap gap-4">
            {LEGAL_LINKS.map((link) => (
              <Link key={link.to} to={link.to} className="text-[11px] font-semibold text-slate-400 hover:text-[#0f9f9a]">
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    );
  }

  return (
    <footer className={["border-t border-white/60 bg-white/42 px-8 py-10 backdrop-blur-xl", className].join(" ")}>
      <div className="mx-auto grid max-w-[1480px] gap-8 lg:grid-cols-[1fr_1fr_auto]">
        <div>
          <p className="text-base font-black text-[#081225]">Troco</p>
          <p className="mt-2 max-w-xs text-sm font-medium leading-relaxed text-[#64748B]">
            Échanger des objets, créer des moments, localement et simplement.
          </p>
          <a href="mailto:troco.mobile@gmail.com" className="mt-3 block text-sm font-semibold text-[#1ABEA3] hover:underline">
            troco.mobile@gmail.com
          </a>
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-[12px] font-black uppercase tracking-[0.08em] text-slate-400">Découvrir Troco</p>
          {DISCOVER_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm font-semibold text-slate-500 hover:text-[#0f9f9a]">
              {link.label}
            </Link>
          ))}
        </div>

        <div className="flex flex-col gap-2 lg:items-end lg:justify-end">
          {LEGAL_LINKS.map((link) => (
            <Link key={link.to} to={link.to} className="text-sm font-semibold text-slate-500 hover:text-[#0f9f9a]">
              {link.label}
            </Link>
          ))}
          <p className="mt-2 text-[12px] font-medium text-slate-300">© 2025 Troco</p>
        </div>
      </div>
    </footer>
  );
}
