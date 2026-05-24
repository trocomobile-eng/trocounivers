import { Link } from "react-router-dom";

const LINKS = [
  { to: "/contact", label: "Contact" },
  { to: "/safety", label: "Sécurité" },
  { to: "/privacy", label: "Confidentialité" },
  { to: "/terms", label: "CGU" },
  { to: "/about", label: "À propos" },
];

export default function LegalFooter({ mobileVisible = false, className = "" }) {
  return (
    <footer
      className={[
        mobileVisible ? "block" : "hidden lg:block",
        "mt-14 border-t border-white/80 px-2 pb-8 pt-7",
        className,
      ].join(" ")}
    >
      <div className="mx-auto flex max-w-7xl flex-col gap-5 rounded-[28px] border border-white/80 bg-white/60 p-5 shadow-[0_8px_24px_rgba(15,23,42,0.035)] backdrop-blur-xl lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-black text-[#081225]">Troco</p>
          <p className="mt-1 text-sm font-medium text-[#64748B]">
            Donner une seconde vie aux objets.
          </p>
        </div>

        <nav className="flex flex-wrap gap-2">
          {LINKS.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className="rounded-full px-3 py-2 text-sm font-bold text-slate-500 transition hover:bg-white/80 hover:text-[#0f9f9a]"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="rounded-full bg-[#E8F7EF] px-4 py-2 text-sm font-black text-[#22a06b]">
          troco.mobile@gmail.com
        </div>
      </div>
    </footer>
  );
}
