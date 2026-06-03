import { Link } from "react-router-dom";
import { UNIVERS } from "../data/univers";

function UniversCard({ univers, large }) {
  const w = large ? 160 : 120;
  const h = large ? 110 : 90;

  return (
    <Link
      to={`/univers/${univers.id}`}
      className="relative shrink-0 overflow-hidden rounded-2xl transition active:scale-[0.97]"
      style={{ width: w, height: h }}
    >
      <img
        src={univers.img}
        alt={univers.label}
        className="h-full w-full object-cover"
        draggable="false"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
      <span
        className="absolute left-2 top-2 font-black leading-none"
        style={{ color: univers.accent, fontSize: large ? 17 : 15 }}
      >
        {univers.icon}
      </span>
      <span
        className="absolute bottom-2 left-0 right-0 text-center font-black leading-none text-white drop-shadow-sm"
        style={{ fontSize: large ? 13 : 12 }}
      >
        {univers.label}
      </span>
    </Link>
  );
}

export default function UniversStrip({ large = false }) {
  return (
    <section>
      <div className="mb-2.5 flex items-center justify-between">
        <p className="text-[12px] font-black uppercase tracking-[0.18em] text-[#0d1b2a]">
          Univers
        </p>
        <Link
          to="/univers"
          className="text-[12px] font-bold text-[#1ABEA3] transition hover:opacity-70"
        >
          Voir tout →
        </Link>
      </div>
      <div className="-mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1 lg:mx-0 lg:px-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {UNIVERS.map((u) => (
          <UniversCard key={u.id} univers={u} large={large} />
        ))}
      </div>
    </section>
  );
}
