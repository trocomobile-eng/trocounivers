import { Link } from "react-router-dom";

const links = [
  { to: "/about", label: "À propos" },
  { to: "/contact", label: "Contact" },
  { to: "/safety", label: "Sécurité" },
  { to: "/privacy", label: "Confidentialité" },
  { to: "/terms", label: "CGU" },
];

export default function TrocoFooter({ mobile = false, className = "" }) {
  return (
    <footer
      className={[
        "troco-footer",
        mobile ? "block" : "hidden lg:block",
        "border-t border-white/60 bg-white/42 px-8 py-10 backdrop-blur-xl",
        className,
      ].join(" ")}
    >
      <div className="mx-auto grid max-w-[1480px] gap-8 lg:grid-cols-4">
        <div>
          <p className="text-base font-black text-[#081225]">Troco</p>
          <p className="mt-2 max-w-xs text-sm font-medium leading-relaxed text-[#64748B]">
            Échanger des objets, créer des moments, localement et simplement.
          </p>
        </div>

        <div>
          <p className="text-sm font-black text-[#081225]">Projet</p>
          <div className="mt-3 space-y-2">
            <Link to="/about" className="block text-sm font-medium text-slate-500 hover:text-[#0f9f9a]">
              À propos
            </Link>
            <Link to="/safety" className="block text-sm font-medium text-slate-500 hover:text-[#0f9f9a]">
              Sécurité
            </Link>
          </div>
        </div>

        <div>
          <p className="text-sm font-black text-[#081225]">Contact</p>
          <div className="mt-3 space-y-2">
            <Link to="/contact" className="block text-sm font-medium text-slate-500 hover:text-[#0f9f9a]">
              Nous contacter
            </Link>
            <a href="mailto:troco.mobile@gmail.com" className="block text-sm font-medium text-slate-500 hover:text-[#0f9f9a]">
              troco.mobile@gmail.com
            </a>
          </div>
        </div>

        <div>
          <p className="text-sm font-black text-[#081225]">Informations</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {links.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="rounded-full bg-white/60 px-3 py-1.5 text-xs font-bold text-slate-500 transition hover:bg-white hover:text-[#0f9f9a]"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
